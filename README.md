<div align="center">

# 🎯 FaceDetector JS

🚀 **轻量级** • 📱 **跨平台** • 🔒 **隐私安全** • ⚡ **即插即用**

一个基于 TensorFlow.js 与 BlazeFace 的浏览器端人脸检测库

[![npm version](https://img.shields.io/npm/v/face-detector-js?color=blue)](https://www.npmjs.com/package/face-detector-js)
[![license](https://img.shields.io/github/license/DouDOU-start/face-detector?color=green)](LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/face-detector-js?color=orange)](https://bundlephobia.com/package/face-detector-js)
[![downloads](https://img.shields.io/npm/dm/face-detector-js?color=red)](https://www.npmjs.com/package/face-detector-js)

[📖 文档](#-api-文档) • [🚀 快速开始](#-快速开始) • [💡 示例](examples/) • [🔧 故障排查](#-故障排查) • [🐛 问题反馈](https://github.com/DouDOU-start/face-detector/issues)

![demo](https://via.placeholder.com/600x300/4CAF50/white?text=Face+Detection+Demo)

</div>

## ✨ 核心特性

<table>
<tr>
<td width="50%">

### 🎯 **智能检测**
- 基于 TensorFlow.js & BlazeFace
- 实时人脸识别与追踪
- 可配置检测间隔和精度
- 支持多人脸同时检测

### 🔧 **开发友好**
- TypeScript 类型支持
- 链式 API 调用
- 丰富的事件回调
- 详细的错误处理

</td>
<td width="50%">

### 📦 **部署灵活**
- 独立版本：零依赖单文件
- 精简版本：按需加载依赖
- CDN 友好，支持缓存
- 完全离线运行能力

### 🛡️ **安全可靠**
- 本地处理，数据不上传
- 代码混淆和 API 冻结
- 跨域安全访问
- 生产环境验证

</td>
</tr>
</table>

## 📁 目录结构

```
face-detector/
├── 🎯 face-detector.js            # 核心源码文件
├── 📦 libs/                       # 依赖库文件夹
│   ├── tf.min.js                  # TensorFlow.js
│   └── blazeface.js               # BlazeFace 模型
├── 🏗️ dist/                       # 构建产物
│   ├── face-detector.min.js       # 精简版（需 libs/）
│   └── face-detector.standalone.min.js  # 独立版（零依赖）
├── 📋 examples/                   # 使用示例
├── 🧠 models/                     # 可选离线模型
├── ⚡ build.js                    # 构建脚本
└── 📄 package.json               # 项目配置
```

## 🚀 快速开始

### 方式一：独立版本（推荐）

无需额外依赖，一个文件搞定：

```html
<!-- 独立单文件：仅需引入这一个脚本 -->
<script src="/dist/face-detector.standalone.min.js"></script>
<script>
  const detector = new FaceDetector({
    showVideo: true,
    videoContainer: 'preview', // DOM id 或 DOM 元素
    interval: 120,
    debug: false,
    camera: { facingMode: 'user', width: 640, height: 480 }
  });

  detector
    .onInitialized(() => console.log('初始化完成'))
    .onFaceDetected(() => console.log('检测到人脸'))
    .onNoFace(() => console.log('未检测到人脸'))
    .onError(err => console.error('错误:', err));

  (async () => {
    await detector.initialize();
    detector.startDetection();
    // 需要时：detector.stopDetection(); detector.destroy();
  })();
  </script>
```

### 方式二：精简版本

如果你使用 `dist/face-detector.min.js`（非独立版本），需要确保 `libs/` 目录可访问：

```html
<script src="/dist/face-detector.min.js"></script>
<script>
  // 源码会在运行时从相对于页面路径的 `libs/` 目录加载依赖
  const detector = new FaceDetector({ showVideo: false });
  (async () => { await detector.initialize(); detector.startDetection(); })();
</script>
```

提示：源码中通过 `loadScript('libs/xxx.js')` 加载依赖，路径相对于“页面 URL”。例如页面为 `/app/index.html`，则需提供 `/app/libs/tf.min.js` 和 `/app/libs/blazeface.js`。

## ⚠️ 浏览器要求

| 要求 | 说明 |
|------|------|
| 🔒 **HTTPS** | 必须在 HTTPS 或 `localhost` 环境下运行 |
| 📹 **摄像头权限** | 首次使用会请求权限，拒绝后需在浏览器设置中重新允许 |
| 📱 **移动端兼容** | 可能需要用户手势触发视频播放 |
| 🌐 **环境限制** | 仅支持浏览器环境，不支持 Node.js |

## 📚 API 文档

### 构造函数

```js
const detector = new FaceDetector(options?)
```

#### 配置选项 (options)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showVideo` | `boolean` | `false` | 是否显示摄像头视频 |
| `videoContainer` | `string \| HTMLElement` | - | 视频容器的 DOM ID 或元素 |
| `interval` | `number` | `100` | 人脸检测间隔（毫秒） |
| `debug` | `boolean` | `false` | 是否输出调试日志 |
| `camera` | `object` | - | 摄像头配置 |
| `camera.facingMode` | `'user' \| 'environment'` | `'user'` | 前置或后置摄像头 |
| `camera.width` | `number` | `640` | 视频宽度 |
| `camera.height` | `number` | `480` | 视频高度 |

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `initialize()` | `Promise<boolean>` | 初始化检测器（申请权限、加载模型） |
| `startDetection()` | `void` | 开始人脸检测 |
| `stopDetection()` | `void` | 停止人脸检测 |
| `destroy()` | `void` | 销毁检测器（释放资源） |

### 事件回调（链式调用）

| 回调 | 参数 | 说明 |
|------|------|------|
| `onInitialized(fn)` | `() => void` | 初始化完成时触发 |
| `onFaceDetected(fn)` | `() => void` | 检测到人脸时触发 |
| `onNoFace(fn)` | `() => void` | 未检测到人脸时触发 |
| `onError(fn)` | `(err: Error) => void` | 出现错误时触发 |

### 🎮 交互式示例

<details>
<summary><b>点击查看完整代码示例</b></summary>

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>人脸检测演示</title>
    <style>
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .video-container { position: relative; margin: 20px 0; }
        .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
        .detected { background: #d4edda; color: #155724; }
        .no-face { background: #f8d7da; color: #721c24; }
        .controls button { margin: 5px; padding: 10px 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 人脸检测演示</h1>
        
        <div class="controls">
            <button onclick="startDemo()">🚀 启动检测</button>
            <button onclick="stopDemo()">⏹️ 停止检测</button>
            <button onclick="toggleCamera()">📷 切换摄像头</button>
        </div>
        
        <div id="camera-preview" class="video-container"></div>
        <div id="status" class="status">📋 准备就绪</div>
        
        <div class="stats">
            <p>检测次数: <span id="detectCount">0</span></p>
            <p>运行时间: <span id="runTime">00:00</span></p>
        </div>
    </div>

    <script src="/dist/face-detector.standalone.min.js"></script>
    <script>
        let detector;
        let detectCount = 0;
        let startTime;
        let timerInterval;

        const detector = new FaceDetector({
            showVideo: true,
            videoContainer: 'camera-preview',
            interval: 100,
            debug: true,
            camera: { facingMode: 'user', width: 640, height: 480 }
        })
        .onInitialized(() => updateStatus('✅ 检测器初始化完成', 'detected'))
        .onFaceDetected(() => {
            detectCount++;
            updateStatus(`👤 检测到人脸 (${detectCount} 次)`, 'detected');
            document.getElementById('detectCount').textContent = detectCount;
        })
        .onNoFace(() => updateStatus('❌ 未检测到人脸', 'no-face'))
        .onError(err => updateStatus(`💥 检测错误: ${err.message}`, 'no-face'));

        async function startDemo() {
            try {
                await detector.initialize();
                detector.startDetection();
                startTimer();
            } catch (error) {
                updateStatus(`❌ 启动失败: ${error.message}`, 'no-face');
            }
        }

        function stopDemo() {
            detector.stopDetection();
            stopTimer();
            updateStatus('⏹️ 检测已停止', '');
        }

        function toggleCamera() {
            // 实现摄像头切换逻辑
            updateStatus('📷 切换摄像头中...', '');
        }

        function updateStatus(message, className) {
            const statusEl = document.getElementById('status');
            statusEl.textContent = message;
            statusEl.className = `status ${className}`;
        }

        function startTimer() {
            startTime = Date.now();
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                document.getElementById('runTime').textContent = `${minutes}:${seconds}`;
            }, 1000);
        }

        function stopTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }
    </script>
</body>
</html>
```

</details>

### 🔧 基础用法

```js
// 最简单的用法
const detector = new FaceDetector()
  .onFaceDetected(() => console.log('👤 发现人脸'))
  .onNoFace(() => console.log('❌ 无人脸'));

await detector.initialize();
detector.startDetection();
```

## 🏗️ 构建说明

### 安装依赖

```bash
npm install -D terser javascript-obfuscator
```

### 执行构建

```bash
npm run build
```

### 构建产物

| 文件 | 大小 | 特点 | 适用场景 |
|------|------|------|----------|
| `dist/face-detector.min.js` | 小 | 需要 `libs/` 目录 | 已有依赖管理的项目 |
| `dist/face-detector.standalone.min.js` | 大 | 零外部依赖 | 快速部署、CDN 分发 |

### 可选：将模型也内联进独立产物（完全离线）

若你在项目内提供 BlazeFace 模型文件，构建脚本会自动把模型也打包进 `face-detector.standalone.min.js`，从而彻底避免网络请求。

目录要求：

```
face-detector/
  models/
    blazeface/
      model.json
      group1-shard1of1.bin   # 或多个 shard：group1-shard1ofN.bin ...
```

注意：`model.json` 内的 `weightsManifest.paths` 所有切片文件必须全部存在，上述文件名可能因版本而异（可能是多个 shard）。

如何获取模型文件：

- 方式 A：在浏览器运行一次在线模型（默认 TFHub），在开发者工具 Network 中保存 `model.json?tfjs-format=file` 和 `group*-shard*.bin?tfjs-format=file` 的响应到本地。
- 方式 B：从你可信的镜像源直接下载相同文件，确保版本匹配。

使用方式：

- 构建后，页面仅需引入 `dist/face-detector.standalone.min.js`，无需再提供 `modelUrl`。库会自动优先使用“内联模型”，找不到才回退到默认的在线地址。
- 如需强制从本地路径加载模型（不使用内联），也可以在初始化时传入 `modelUrl: '相对路径/model.json'`。

注意：独立产物需要在构建时项目根目录存在 `./libs/tf.min.js` 与 `./libs/blazeface.js`。若缺失，将跳过独立产物并在控制台提示。

## 生产部署建议

- 使用独立文件时可启用 SRI（子资源完整性）校验，检测被替换/篡改：

```html
<!-- 请根据你的实际文件计算 sha384 哈希并替换 integrity -->
<script src="/dist/face-detector.standalone.min.js"
        integrity="sha384-..."
        crossorigin="anonymous"></script>
```

- 计算示例（本地）：

```bash
# macOS/Linux
openssl dgst -sha384 -binary dist/face-detector.standalone.min.js | openssl base64 -A
```

- 若对体积敏感：使用非独立版本，并放置 `libs/` 到与你的页面同级路径。
- 若需 CDN：可使用独立版本直接上 CDN；或将 `libs/` 指向 CDN（需改源码中的加载路径再构建）。

## 🔧 故障排查

<details>
<summary><b>常见问题解决方案</b></summary>

### 🚫 依赖加载问题

```js
// 问题：libs/ 路径 404
// 解决：确保文件路径正确
console.log('检查文件是否存在：');
fetch('/libs/tf.min.js').then(res => console.log('TF.js:', res.ok));
fetch('/libs/blazeface.js').then(res => console.log('BlazeFace:', res.ok));
```

### 📹 摄像头权限问题

```js
// 检查摄像头权限
navigator.permissions.query({ name: 'camera' }).then(result => {
  console.log('摄像头权限状态:', result.state);
  if (result.state === 'denied') {
    alert('请在浏览器设置中允许摄像头权限');
  }
});
```

### 🔇 自动播放限制

```html
<!-- 添加用户交互按钮 -->
<button onclick="startDetection()">点击启动检测</button>
<script>
async function startDetection() {
  try {
    await detector.initialize();
    detector.startDetection();
  } catch (error) {
    console.error('启动失败:', error);
  }
}
</script>
```

### 📱 移动端适配

```js
// 移动端检测和适配
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const detector = new FaceDetector({
  camera: {
    facingMode: isMobile ? 'environment' : 'user', // 移动端默认后置
    width: isMobile ? 480 : 640,
    height: isMobile ? 320 : 480
  },
  interval: isMobile ? 200 : 100 // 移动端降低检测频率
});
```

</details>

### ❓ 快速诊断

| 症状 | 检查项 | 解决方案 |
|------|--------|----------|
| 🚫 **无法加载** | 网络请求 | 检查 `libs/` 文件路径和权限 |
| 📹 **黑屏** | HTTPS + 权限 | 使用 HTTPS，允许摄像头权限 |
| 🔇 **静音图标** | 自动播放策略 | 添加用户交互触发 |
| 👤 **检测失败** | 环境光线 | 改善光照，调整参数 |
| 📱 **移动端卡顿** | 性能优化 | 降低分辨率和检测频率 |

## 🔒 安全说明

- ✅ 代码已最小化和混淆处理
- ✅ 运行时冻结 API 防止篡改
- ⚠️ 浏览器环境无法做到绝对防护
- 🎯 旨在提高恶意修改的难度和成本

## 📊 项目统计

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/DouDOU-start/face-detector)
![GitHub code size](https://img.shields.io/github/languages/code-size/DouDOU-start/face-detector)
![GitHub top language](https://img.shields.io/github/languages/top/DouDOU-start/face-detector)
![GitHub last commit](https://img.shields.io/github/last-commit/DouDOU-start/face-detector)

</div>

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. 🍴 Fork 这个仓库
2. 🔀 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 💾 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 📤 推送到分支 (`git push origin feature/AmazingFeature`)
5. 🔃 开启一个 Pull Request

### 贡献类型

- 🐛 **Bug修复**: 发现并修复问题
- ✨ **新功能**: 添加新的有用功能
- 📖 **文档**: 改进文档和示例
- 🎨 **代码优化**: 提升代码质量和性能
- 🧪 **测试**: 添加或改进测试用例

---

<div align="center">

## 💖 支持这个项目

**如果这个项目对你有帮助，请给个 ⭐ 支持一下！**

[![GitHub stars](https://img.shields.io/github/stars/DouDOU-start/face-detector?style=social)](https://github.com/DouDOU-start/face-detector/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/DouDOU-start/face-detector?style=social)](https://github.com/DouDOU-start/face-detector/network)
[![GitHub issues](https://img.shields.io/github/issues/DouDOU-start/face-detector)](https://github.com/DouDOU-start/face-detector/issues)
[![GitHub license](https://img.shields.io/github/license/DouDOU-start/face-detector)](https://github.com/DouDOU-start/face-detector/blob/main/LICENSE)

### 👨‍💻 作者

**DouDOU-start** 
- GitHub: [@DouDOU-start](https://github.com/DouDOU-start)
- 如果有问题欢迎提交 [Issue](https://github.com/DouDOU-start/face-detector/issues)

---

### 🌟 其他项目

查看更多开源项目：[DouDOU-start](https://github.com/DouDOU-start?tab=repositories)

---

*Built with ❤️ by DouDOU-start*

</div>
