# FaceDetector JS

基于 TensorFlow.js 和 BlazeFace 的轻量级浏览器人脸检测库。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/DouDOU-start/face-detector?style=social)](https://github.com/DouDOU-start/face-detector)

**🚀 [在线演示](https://doudou-start.github.io/face-detector/) | 📖 [API文档](#api-文档) | 💡 [示例代码](#快速开始)**

## 特性

- **实时检测**：快速人脸检测，可配置检测间隔
- **离线可用**：支持完全离线运行的独立版本
- **简单易用**：链式API调用和事件回调
- **隐私优先**：所有处理在浏览器本地完成
- **灵活部署**：支持独立版本或模块化加载

## 快速开始

```html
<!-- 引入独立版本 -->
<script src="dist/face-detector.standalone.min.js"></script>

<script>
const detector = new FaceDetector({ showVideo: true })
  .onFaceDetected(() => console.log('检测到人脸'))
  .onNoFace(() => console.log('未检测到人脸'));

await detector.initialize();
detector.startDetection();
</script>
```

## API 文档

### 构造函数
```js
new FaceDetector(options)
```

**配置选项：**
- `showVideo: boolean` - 显示摄像头画面（默认：false）
- `videoContainer: string|Element` - 视频容器元素
- `interval: number` - 检测间隔毫秒数（默认：100）
- `camera: object` - 摄像头设置（facingMode, width, height）

### 方法
- `initialize()` - 初始化检测器并请求摄像头权限
- `startDetection()` - 开始人脸检测
- `stopDetection()` - 停止检测
- `destroy()` - 清理资源

### 事件回调
- `onInitialized(fn)` - 初始化完成时触发
- `onFaceDetected(fn)` - 检测到人脸时触发
- `onNoFace(fn)` - 未检测到人脸时触发
- `onError(fn)` - 出现错误时触发

## 构建

```bash
npm install -D terser javascript-obfuscator
npm run build
```

生成文件：
- `dist/face-detector.min.js` - 压缩版本（需要 libs/ 目录）
- `dist/face-detector.standalone.min.js` - 独立版本

## 浏览器要求

- 必须使用 HTTPS 或 localhost（摄像头访问要求）
- 支持 getUserMedia 的现代浏览器
- 需要授予摄像头权限

## 许可证

MIT © [DouDOU-start](https://github.com/DouDOU-start)