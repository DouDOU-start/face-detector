/**
 * 人脸检测库 - FaceDetector
 * 支持离线和在线检测，自动处理相机权限
 * 
 * @version 1.0.0
 * @author AI Assistant
 */

// 动态加载必要的库文件（支持CDN与自定义地址）
let librariesLoaded = false;
let loadingPromise = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (!src) { reject(new Error('Invalid script src')); return; }
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load script: ' + src));
        document.head.appendChild(script);
    });
}

async function ensureLibrariesLoaded(options = {}) {
    if (librariesLoaded) return;
    if (loadingPromise) return loadingPromise;

    const defaultTfUrl = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js';
    const defaultBlazeUrl = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface/dist/blazeface.min.js';

    const tfUrl = options?.libUrls?.tf || null; // for npm usage we try local deps first
    const blazeUrl = options?.libUrls?.blazeface || null;
    
    loadingPromise = (async () => {
        try {
            // 优先从本地 npm 依赖加载（完全离线）
            if (typeof tf === 'undefined') {
                try {
                    if (typeof require === 'function') {
                        // CJS 环境
                        var __tf = require('@tensorflow/tfjs');
                        if (__tf) { (typeof globalThis !== 'undefined' ? globalThis : window).tf = __tf; }
                    } else if (typeof import !== 'undefined') {
                        // ESM 动态导入
                        const mod = await import('@tensorflow/tfjs');
                        (typeof globalThis !== 'undefined' ? globalThis : window).tf = mod;
                    }
                } catch (e) { /* ignore here, will fallback below */ }
            }
            if (typeof blazeface === 'undefined') {
                try {
                    if (typeof require === 'function') {
                        var __blaze = require('@tensorflow-models/blazeface');
                        if (__blaze) { (typeof globalThis !== 'undefined' ? globalThis : window).blazeface = __blaze; }
                    } else if (typeof import !== 'undefined') {
                        const mod = await import('@tensorflow-models/blazeface');
                        (typeof globalThis !== 'undefined' ? globalThis : window).blazeface = mod;
                    }
                } catch (e) { /* ignore here, will fallback below */ }
            }

            // 若仍未加载到，则尝试使用用户提供 libUrls；最后再回退到 CDN
            if (typeof tf === 'undefined') {
                if (tfUrl) {
                    await loadScript(tfUrl);
                } else {
                    await loadScript(defaultTfUrl);
                }
            }
            if (typeof blazeface === 'undefined') {
                if (blazeUrl) {
                    await loadScript(blazeUrl);
                } else {
                    await loadScript(defaultBlazeUrl);
                }
            }
            
            // 等待TensorFlow.js准备就绪
            if (typeof tf !== 'undefined' && typeof tf.ready === 'function') {
                await tf.ready();
            }
            
            librariesLoaded = true;
        } catch (error) {
            console.error('库文件加载失败:', error);
            throw error;
        }
    })();
    
    return loadingPromise;
}

// 全局模型管理
let globalBlazeFaceModel = null;
let isModelLoading = false;
let modelLoadPromise = null;

class FaceDetector {
    constructor(options = {}) {
        this.options = {
            // 是否显示视频流（默认隐藏）
            showVideo: options.showVideo || false,
            // 视频容器元素ID或DOM元素
            videoContainer: options.videoContainer || null,
            // 检测间隔（毫秒）
            interval: options.interval || 100,
            // 是否启用日志
            debug: options.debug || false,
            // 模型地址（可选）：指向 blazeface 的 model.json，本地优先
            // 例如：'./models/blazeface/model.json'
            modelUrl: options.modelUrl || null,
            // 可选：第三方库地址（CDN或自定义路径）
            // { tf: '...', blazeface: '...' }
            libUrls: options.libUrls || {},
            // 相机配置
            camera: {
                facingMode: options.camera?.facingMode || 'user',
                width: options.camera?.width || 640,
                height: options.camera?.height || 480
            }
        };

        this.isInitialized = false;
        this.isDetecting = false;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.model = null;
        this.detectionMode = 'blazeface';
        this.callbacks = {
            onFaceDetected: null,
            onNoFace: null,
            onError: null,
            onInitialized: null
        };
    }

    /**
     * 初始化检测器
     */
    async initialize() {
        try {
            this.log('🚀 初始化人脸检测器...');
            
            await this.setupVideo();
            await this.loadModels();
            
            this.isInitialized = true;
            this.log('✅ 人脸检测器初始化完成');
            
            if (this.callbacks.onInitialized) {
                this.callbacks.onInitialized();
            }
            
            return true;
        } catch (error) {
            this.log('❌ 初始化失败:', error.message);
            console.error('FaceDetector initialization error:', error);
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
            throw error;
        }
    }

    /**
     * 设置视频流
     */
    async setupVideo() {
        // 创建视频元素
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.playsinline = true;
        this.video.muted = true;
        
        // 创建画布（用于检测）
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        if (this.options.showVideo) {
            this.setupVideoDisplay();
        } else {
            // 隐藏视频元素
            this.video.style.display = 'none';
            this.canvas.style.display = 'none';
        }

        // 请求相机权限
        await this.requestCameraPermission();
    }

    /**
     * 设置视频显示
     */
    setupVideoDisplay() {
        let container;
        
        if (this.options.videoContainer) {
            if (typeof this.options.videoContainer === 'string') {
                container = document.getElementById(this.options.videoContainer);
            } else {
                container = this.options.videoContainer;
            }
        } else {
            // 创建默认容器
            container = document.createElement('div');
            container.id = 'face-detector-container';
            container.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                width: 300px;
                height: 200px;
                border: 2px solid #ccc;
                border-radius: 8px;
                overflow: hidden;
                z-index: 1000;
                background: #000;
            `;
            document.body.appendChild(container);
        }

        // 设置视频样式
        this.video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        container.appendChild(this.video);
    }

    /**
     * 请求相机权限
     */
    async requestCameraPermission() {
        try {
            const constraints = {
                video: {
                    facingMode: this.options.camera.facingMode,
                    width: { ideal: this.options.camera.width },
                    height: { ideal: this.options.camera.height }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;

            return new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    this.log(`📐 视频尺寸: ${this.video.videoWidth}x${this.video.videoHeight}`);
                    resolve();
                };
                
                this.video.onerror = reject;
                this.video.play().catch(reject);
            });
            
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                throw new Error('相机权限被拒绝，请在浏览器设置中允许相机访问');
            } else if (error.name === 'NotFoundError') {
                throw new Error('未找到可用的相机设备');
            } else {
                throw new Error(`相机访问失败: ${error.message}`);
            }
        }
    }

    /**
     * 加载检测模型
     */
    async loadModels() {
        // 首先确保库文件已加载
        await ensureLibrariesLoaded(this.options);
        
        if (typeof tf === 'undefined' || typeof blazeface === 'undefined') {
            throw new Error('TensorFlow.js或BlazeFace库未加载');
        }
        
        if (isModelLoading && !modelLoadPromise) {
            isModelLoading = false;
            globalBlazeFaceModel = null;
        }
        
        const loadPromise = this.loadBlazeFaceModel();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('模型加载超时')), 15000)
        );
        
        await Promise.race([loadPromise, timeoutPromise]);
        this.detectionMode = 'blazeface';
        this.log('✅ BlazeFace模型加载完成');
    }

    /**
     * 加载BlazeFace模型
     */
    async loadBlazeFaceModel() {
        if (globalBlazeFaceModel) {
            this.model = globalBlazeFaceModel;
            return;
        }
        
        if (isModelLoading && modelLoadPromise) {
            this.model = await modelLoadPromise;
            return;
        }
        
        isModelLoading = true;
        
        try {
            modelLoadPromise = this.loadBlazeFaceModelSingleton();
            this.model = await modelLoadPromise;
            globalBlazeFaceModel = this.model;
        } catch (error) {
            globalBlazeFaceModel = null;
            modelLoadPromise = null;
            throw error;
        } finally {
            isModelLoading = false;
        }
    }
    
    async loadBlazeFaceModelSingleton() {
        // 优先顺序：① 显式传入的 modelUrl（可为 URL 字符串或 IOHandler 对象）
        //         ② 若存在内联模型（由构建器注入全局 IOHandler），则使用该 IOHandler
        //         ③ 否则走 blazeface 默认的 TFHub 远端加载
        let opts = undefined;
        if (this.options.modelUrl) {
            opts = { modelUrl: this.options.modelUrl };
        } else if (typeof window !== 'undefined' && window.__BLAZEFACE_EMBEDDED_IO_HANDLER__) {
            // Standalone bundle path: global IOHandler injected by build
            opts = { modelUrl: window.__BLAZEFACE_EMBEDDED_IO_HANDLER__ };
        } else {
            // NPM path: try to require embedded IOHandler module (bundlers will inline it)
            try {
                // eslint-disable-next-line global-require, import/no-dynamic-require
                const embedded = (typeof require === 'function') ? require('./models/blazeface/embedded.js') : null;
                if (embedded && typeof embedded.load === 'function') {
                    opts = { modelUrl: embedded };
                }
            } catch (_) { /* ignore */ }
        }
        return await blazeface.load(opts);
    }

    /**
     * 开始检测
     */
    startDetection() {
        if (!this.isInitialized) {
            throw new Error('检测器未初始化，请先调用 initialize()');
        }

        if (this.isDetecting) {
            return;
        }

        this.isDetecting = true;
        this.log('🔍 开始BlazeFace检测');
        this.detectLoop();
    }

    /**
     * 停止检测
     */
    stopDetection() {
        this.isDetecting = false;
        this.log('⏹️ 检测已停止');
    }

    /**
     * 检测循环
     */
    async detectLoop() {
        if (!this.isDetecting || this.video.readyState < 2) {
            if (this.isDetecting) {
                setTimeout(() => this.detectLoop(), this.options.interval);
            }
            return;
        }

        try {
            const hasFace = await this.detectFace();
            
            if (hasFace) {
                if (this.callbacks.onFaceDetected) {
                    this.callbacks.onFaceDetected();
                }
            } else {
                if (this.callbacks.onNoFace) {
                    this.callbacks.onNoFace();
                }
            }
        } catch (error) {
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        }

        if (this.isDetecting) {
            setTimeout(() => this.detectLoop(), this.options.interval);
        }
    }

    /**
     * 检测人脸
     * @returns {boolean} 是否检测到人脸
     */
    async detectFace() {
        const predictions = await this.model.estimateFaces(this.video, false);
        return predictions.length > 0;
    }


    /**
     * 设置回调函数
     */
    onFaceDetected(callback) {
        this.callbacks.onFaceDetected = callback;
        return this;
    }

    onNoFace(callback) {
        this.callbacks.onNoFace = callback;
        return this;
    }

    onError(callback) {
        this.callbacks.onError = callback;
        return this;
    }

    onInitialized(callback) {
        this.callbacks.onInitialized = callback;
        return this;
    }

    /**
     * 日志输出
     */
    log(...args) {
        if (this.options.debug) {
            console.log('[FaceDetector]', ...args);
        }
    }

    /**
     * 销毁检测器
     */
    destroy() {
        this.stopDetection();
        
        // 释放摄像头资源
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        if (this.video && this.video.parentNode) {
            this.video.parentNode.removeChild(this.video);
        }
        
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.model = null;
        this.isInitialized = false;
        
        this.log('检测器已销毁');
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaceDetector;
} else if (typeof window !== 'undefined') {
    window.FaceDetector = FaceDetector;
}
