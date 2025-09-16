// ESM-only FaceDetector that avoids dynamic imports and uses provided libs

function getDefaults() {
  try {
    return (typeof globalThis !== 'undefined' ? globalThis : window).__FACE_DETECTOR_DEFAULTS || {};
  } catch (e) {
    return {};
  }
}

let isInitialized = false;
let loadingPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (!src) return void reject(new Error('需要脚本地址'));
    if (document.querySelector(`script[src="${src}"]`)) return void resolve();

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load script: ' + src));
    document.head.appendChild(script);
  });
}

async function loadDependencies(options = {}) {
  if (isInitialized) return;
  if (loadingPromise) return loadingPromise;

  const defaults = getDefaults();
  const libUrls = {
    ...(defaults.libUrls || {}),
    ...(options?.libUrls || {})
  };

  const offlineOnly = options.offlineOnly !== undefined
    ? !!options.offlineOnly
    : (typeof defaults.offlineOnly === 'boolean' ? defaults.offlineOnly : true);

  loadingPromise = (async () => {
    try {
      // Load TensorFlow.js
      if (typeof tf === 'undefined') {
        if (libUrls.tf) {
          await loadScript(libUrls.tf);
        } else if (!offlineOnly) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js');
        } else {
          throw new Error('TensorFlow.js 未找到，请确保提供 libUrls.tf（offlineOnly=true）');
        }
      }

      // Load BlazeFace
      if (typeof blazeface === 'undefined') {
        if (libUrls.blazeface || libUrls.blaze) {
          await loadScript(libUrls.blazeface || libUrls.blaze);
        } else if (!offlineOnly) {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.js');
        } else {
          throw new Error('BlazeFace 未找到，请确保提供 libUrls.blazeface（offlineOnly=true）');
        }
      }

      if (typeof tf !== 'undefined' && typeof tf.ready === 'function') {
        await tf.ready();
      }

      isInitialized = true;
    } catch (error) {
      console.error('库文件加载失败:', error);
      throw error;
    }
  })();

  return loadingPromise;
}

let model = null;
let loading = false;
let modelPromise = null;

class FaceDetector {
  constructor(options = {}) {
    const defaults = getDefaults();
    const libUrls = {
      ...(defaults.libUrls || {}),
      ...(options.libUrls || {})
    };

    const offlineOnly = options.offlineOnly !== undefined
      ? !!options.offlineOnly
      : (typeof defaults.offlineOnly === 'boolean' ? defaults.offlineOnly : true);

    this.options = {
      showVideo: options.showVideo !== undefined && !!options.showVideo,
      videoContainer: options.videoContainer || null,
      interval: options.interval || 100,
      debug: options.debug || false,
      modelUrl: options.modelUrl || defaults.modelUrl || null,
      libUrls,
      offlineOnly,
      camera: {
        facingMode: options.camera?.facingMode || 'user',
        width: options.camera?.width || 640,
        height: options.camera?.height || 480
      }
    };

    this.embeddedModelProvider = defaults.embeddedModel || null;
    this.isInitialized = false;
    this.isDetecting = false;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.hiddenContainer = null;
    this.model = null;
    this.detectionType = 'blazeface';
    this.callbacks = {
      onFaceDetected: null,
      onNoFace: null,
      onError: null,
      onInitialized: null
    };
  }

  async initialize() {
    try {
      this.log('🚀 正在初始化...');
      await this.setupVideo();
      await this.loadModel();
      this.isInitialized = true;
      this.log('✅ 初始化完成');
      this.callbacks.onInitialized && this.callbacks.onInitialized();
      return true;
    } catch (error) {
      this.log('初始化失败:', error.message);
      console.error('FaceDetector initialization error:', error);
      this.callbacks.onError && this.callbacks.onError(error);
      throw error;
    }
  }

  async setupVideo() {
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    if (this.options.showVideo) {
      this.createVideoContainer();
    } else {
      this.createHiddenContainer();
    }

    await this.requestCameraPermission();
  }

  createVideoContainer() {
    let container;
    if (this.options.videoContainer) {
      container = typeof this.options.videoContainer === 'string'
        ? document.getElementById(this.options.videoContainer)
        : this.options.videoContainer;
    } else {
      container = document.createElement('div');
      container.id = 'face-detector-container';
      container.style.cssText = `
        position: relative;
        display: inline-block;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        background: rgba(0,0,0,0.8);
      `;
      document.body.appendChild(container);
    }

    this.video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    container.appendChild(this.video);
  }

  createHiddenContainer() {
    if (!this.hiddenContainer) {
      this.hiddenContainer = document.createElement('div');
      document.body.appendChild(this.hiddenContainer);
    }

    this.hiddenContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: ${this.options.camera.width}px;
      height: ${this.options.camera.height}px;
      opacity: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: -1;
    `;

    this.video.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      pointer-events: none;
    `;

    this.canvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      pointer-events: none;
    `;

    if (!this.hiddenContainer.contains(this.video)) {
      this.hiddenContainer.appendChild(this.video);
    }
    if (!this.hiddenContainer.contains(this.canvas)) {
      this.hiddenContainer.appendChild(this.canvas);
    }
  }

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
          this.log('📐 视频尺寸: ' + this.video.videoWidth + 'x' + this.video.videoHeight);
          resolve();
        };
        this.video.onerror = reject;
        const playPromise = this.video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(reject);
        }
      });
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('用户拒绝了相机访问');
      } else if (error.name === 'NotFoundError') {
        throw new Error('未找到摄像头设备');
      } else {
        throw new Error('相机访问失败: ' + error.message);
      }
    }
  }

  async loadModel() {
    await loadDependencies(this.options);

    if (typeof tf === 'undefined' || typeof blazeface === 'undefined') {
      throw new Error('TensorFlow.js或BlazeFace模型未加载');
    }

    if (loading && !modelPromise) {
      loading = false;
      model = null;
    }

    const loadTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('模型加载超时')), 15000)
    );

    await Promise.race([this.loadBlazeFaceModel(), loadTimeout]);
    this.detectionType = 'blazeface';
    this.log('✅ BlazeFace模型加载完成');
  }

  async loadBlazeFaceModel() {
    if (model) {
      this.model = model;
    } else if (loading && modelPromise) {
      this.model = await modelPromise;
    } else {
      loading = true;
      try {
        modelPromise = this.loadBlazeFaceModelFromProvider();
        this.model = await modelPromise;
        model = this.model;
      } catch (error) {
        model = null;
        modelPromise = null;
        throw error;
      } finally {
        loading = false;
      }
    }
  }

  async loadBlazeFaceModelFromProvider() {
    let config;

    if (this.options.modelUrl) {
      config = { modelUrl: this.options.modelUrl };
    } else if (this.embeddedModelProvider) {
      config = { modelUrl: this.embeddedModelProvider };
    } else if (typeof window !== 'undefined' && window.__BLAZEFACE_EMBEDDED_IO_HANDLER__) {
      config = { modelUrl: window.__BLAZEFACE_EMBEDDED_IO_HANDLER__ };
    } else {
      try {
        const embeddedModule = await import('../models/blazeface/embedded.js');
        const ioHandler = embeddedModule.default || embeddedModule;
        if (ioHandler && typeof ioHandler.load === 'function') {
          config = { modelUrl: ioHandler };
        }
      } catch (e) {
        // 回退到默认模型
      }
    }

    return await blazeface.load(config);
  }

  startDetection() {
    if (!this.isInitialized) {
      throw new Error('请先调用 initialize() 方法初始化（或使用autoInit=true）');
    }

    if (!this.isDetecting) {
      this.isDetecting = true;
      this.log('🔍 开始人脸检测');
      this.detectLoop();
    }
  }

  stopDetection() {
    this.isDetecting = false;
    this.log('⏹️ 检测停止');
  }

  async detectLoop() {
    if (!this.isDetecting || this.video.readyState < 2) {
      if (this.isDetecting) {
        setTimeout(() => this.detectLoop(), this.options.interval);
      }
      return;
    }

    try {
      const detected = await this.detectFaces();
      detected
        ? this.callbacks.onFaceDetected && this.callbacks.onFaceDetected()
        : this.callbacks.onNoFace && this.callbacks.onNoFace();
    } catch (error) {
      this.callbacks.onError && this.callbacks.onError(error);
    }

    if (this.isDetecting) {
      setTimeout(() => this.detectLoop(), this.options.interval);
    }
  }

  async detectFaces() {
    if (!this.video || !this.canvas || !this.ctx) {
      throw new Error('视频或画布未初始化');
    }

    const { videoWidth, videoHeight } = this.video;
    if (!videoWidth || !videoHeight) {
      return false;
    }

    if (this.canvas.width !== videoWidth || this.canvas.height !== videoHeight) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
    }

    // 将视频帧绘制到离屏画布，避免隐藏视频时拿不到像素数据
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    const predictions = await this.model.estimateFaces(this.canvas, false);
    return predictions.length > 0;
  }

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

  log(...args) {
    if (this.options.debug) {
      console.log('[FaceDetector]', ...args);
    }
  }

  destroy() {
    this.stopDetection();

    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
    }

    if (this.video && this.video.parentNode) {
      this.video.parentNode.removeChild(this.video);
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    if (this.hiddenContainer && this.hiddenContainer.parentNode) {
      this.hiddenContainer.parentNode.removeChild(this.hiddenContainer);
    }

    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.hiddenContainer = null;
    this.model = null;
    this.isInitialized = false;
    this.log('🗑️ 已销毁');
  }
}

export { FaceDetector };
export default FaceDetector;
