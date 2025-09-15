# face-detector-lite

基于 TensorFlow.js 与 BlazeFace 的轻量级浏览器人脸检测库。支持纯离线 npm 使用（内置模型 + 本地依赖）、CDN 独立版、以及 Vue 3 组件封装。

[![npm version](https://img.shields.io/npm/v/face-detector-lite.svg)](https://www.npmjs.com/package/face-detector-lite)
[![npm downloads](https://img.shields.io/npm/dm/face-detector-lite.svg)](https://www.npmjs.com/package/face-detector-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/DouDOU-start/face-detector?style=social)](https://github.com/DouDOU-start/face-detector)

链接速览：

- 在线演示： https://doudou-start.github.io/face-detector/
- CDN 独立版：
  - jsDelivr: https://cdn.jsdelivr.net/npm/face-detector-lite/dist/face-detector.standalone.min.js
  - unpkg: https://unpkg.com/face-detector-lite/dist/face-detector.standalone.min.js
- NPM： `npm i face-detector-lite`

目录
- 特性
- 安装与使用（CDN / ESM / NPM）
- Vue 3 组件
- API 文档
  - 构造函数与配置
  - 方法
  - 事件回调
- 离线模式说明
- 性能与实践建议
- 常见问题（FAQ）
- 浏览器要求
- 许可证

## 📸 演示预览

<div align="center">
  <img src="docs/demo-screenshot.png" alt="FaceDetector JS 演示界面" width="800"/>
  <p><em>专业的人脸检测演示界面，具有实时状态监控和日志系统</em></p>
</div>

## 特性

- **实时检测**：快速人脸检测，可配置检测间隔
- **离线可用**：支持完全离线运行的独立版本
- **简单易用**：链式API调用和事件回调
- **隐私优先**：所有处理在浏览器本地完成
- **灵活部署**：支持独立版本或模块化加载

## 🎮 在线演示功能

访问 [在线演示](https://doudou-start.github.io/face-detector/) 体验完整功能：

- ⚡ **专业控制面板** - 智能按钮状态管理，可调节检测间隔
- 📊 **实时统计监控** - 人脸数量、FPS、运行时间显示
- 🎯 **动态状态指示** - 初始化、检测中、错误等状态实时反馈
- 📝 **详细日志系统** - 时间戳记录，彩色状态图标
- 🎨 **视觉反馈效果** - 检测边框变色（绿色=有人脸，红色=无人脸）
- 📱 **移动端适配** - 响应式设计，支持手机和平板访问

## 安装与使用

### 方式一：CDN 独立版（开箱即用）

```html
<!-- jsDelivr（独立版，已内置 TF.js 与 BlazeFace） -->
<script src="https://cdn.jsdelivr.net/npm/face-detector-lite/dist/face-detector.standalone.min.js"></script>
<!-- 或：unpkg -->
<!-- <script src="https://unpkg.com/face-detector-lite/dist/face-detector.standalone.min.js"></script> -->

<script>
const detector = new FaceDetector({ showVideo: true })
  .onFaceDetected(() => console.log('检测到人脸'))
  .onNoFace(() => console.log('未检测到人脸'));

await detector.initialize();
detector.startDetection();
</script>
```

### 方式二：CDN ESM（按需导入）

如需用 ESM 方式按需导入（不包含第三方库），可通过 jsDelivr 的 +esm：

```html
<script type="module">
  import FaceDetector from 'https://cdn.jsdelivr.net/npm/face-detector-lite/+esm';
  const detector = new FaceDetector({ showVideo: true });
  await detector.initialize();
  detector.startDetection();
  // 如需离线或指定第三方库，请传入 libUrls 覆盖 CDN 地址
  // new FaceDetector({ libUrls: { tf: '...', blazeface: '...' } })
</script>
```

### 方式三：作为 NPM 包（默认离线模型与本地依赖）

安装后即离线运行：模型已内置，TensorFlow.js 与 BlazeFace 库从本地依赖加载（无需 CDN）。默认 `offlineOnly=true`，若本地依赖缺失将报错而不会回退到网络。

```bash
npm install face-detector-lite
```

在应用中导入并使用（TypeScript 同样支持）：

```js
import FaceDetector from 'face-detector-lite';
// import type { FaceDetectorOptions } from 'face-detector-lite';

const detector = new FaceDetector({
  showVideo: true,
  // 可选：自定义第三方库地址（默认不需要，已从本地依赖加载）
  // libUrls: { tf: '/local/tf.min.js', blazeface: '/local/blazeface.min.js' },
  // 可选：允许回退到网络（默认不允许）
  // offlineOnly: false
});

await detector.initialize();
detector.startDetection();
```

## Vue 3 组件

本库内置 Vue 3 组件封装，导入子路径 `face-detector-lite/vue` 即可：

```js
// 方式一：按需局部注册
import { FaceDetectorView } from 'face-detector-lite/vue';

// 方式二：作为插件全局注册
import FaceDetectorPlugin from 'face-detector-lite/vue';
app.use(FaceDetectorPlugin);
```

组件模板示例：

```vue
<template>
  <FaceDetectorView
    class="preview"
    :interval="120"
    :camera="{ facingMode: 'user', width: 640, height: 480 }"
    @initialized="onReady"
    @detected="onDetected"
    @no-face="onNoFace"
    @error="onError"
  />
</template>

<script setup>
function onReady() { console.log('ready'); }
function onDetected() { console.log('face'); }
function onNoFace() { console.log('no face'); }
function onError(e) { console.error(e); }
</script>
```

> 组件会在内部把视频渲染到自身容器中，默认在 mounted 后完成初始化并开始检测。可通过 `startOnMounted` 控制是否自动开始。
> 使用 NPM 引入时，无需网络：模型与依赖均从本地加载。

隐藏组件但保留功能（仅检测不显示视频）：

```vue
<FaceDetectorView :show-video="false" />
```

完全不渲染任何 DOM（仅功能，不占位）：

```vue
<FaceDetectorView :show-video="false" :render-container="false" />
```

## API 文档

### 构造函数
```js
new FaceDetector(options)
```

配置选项（核心）：
- `showVideo?: boolean`（默认 `false`）：是否显示摄像头画面
- `videoContainer?: string | Element | null`：视频容器（Vue 组件内部会自动设置）
- `interval?: number`（默认 `100`）：检测间隔毫秒数
- `debug?: boolean`：输出调试日志
- `modelUrl?: string | IOHandler`：自定义 BlazeFace 模型地址或 TFJS IOHandler
- `libUrls?: { tf?: string; blazeface?: string }`：自定义 TF.js/BlazeFace 加载地址
  - NPM 场景：默认从本地依赖加载，不需要配置
  - CDN 场景：如需替换默认地址可通过此项指定
- `offlineOnly?: boolean`（默认 `true`）：离线模式；当本地依赖不可用时抛错，而不是回退网络
- `camera?: { facingMode?: 'user' | 'environment'; width?: number; height?: number }`：摄像头配置

方法：
- `initialize(): Promise<boolean>` - 初始化并请求摄像头权限
- `startDetection(): void` - 开始检测
- `stopDetection(): void` - 停止检测
- `destroy(): void` - 清理资源
- `detectFace(): Promise<boolean>` - 立即执行一次检测

事件回调：
- `onInitialized(fn)` - 初始化完成时触发
- `onFaceDetected(fn)` - 检测到人脸
- `onNoFace(fn)` - 未检测到人脸
- `onError(fn)` - 出现错误

## 离线模式说明

- NPM 引入：
  - 模型：包内置 `models/blazeface/embedded.js`，默认优先使用
  - 依赖：通过 `require('@tensorflow/tfjs')` 与 `require('@tensorflow-models/blazeface')` 本地加载
  - 回退策略：`offlineOnly=true`（默认）时，不会回退到网络；若设为 `false` 可使用 `libUrls` 或默认 CDN
- CDN 独立版：单文件包含 TF.js + BlazeFace + 模型，天然离线

## 本地构建

```bash
npm install -D terser javascript-obfuscator
npm run build
```

生成文件：
- `dist/face-detector.min.js` - 压缩版本（需要 libs/ 目录）
- `dist/face-detector.standalone.min.js` - 独立版本

## 性能与实践建议

- 适当提高 `interval`（如 120–200ms）降低 CPU 压力
- 降低视频分辨率（如 `width: 640, height: 480`）以提升 FPS
- 在空闲时调用 `detector.stopDetection()` 暂停检测，节省资源
- 避免在低电量或移动网络环境下长时间运行摄像头

## 常见问题（FAQ）

- 权限问题：必须在 HTTPS 或 localhost 环境访问，并允许浏览器摄像头权限。
- iOS Safari：需确保使用前台标签页，并在用户手势后启动播放。
- 离线/内网：NPM 场景默认离线；CDN 场景可将 `libUrls` 指向自有地址，或使用本仓库 `libs/` 与独立版。
- SSR 使用：本库需在浏览器环境中调用（依赖 `window`/`navigator`）。
  - 在 Nuxt/Next 等框架中，仅在客户端生命周期加载；或在路由层关闭 SSR 对应页面

## 安全与隐私

- 所有推理都在本地浏览器进行，图像不会上传到服务器
- 请告知用户摄像头使用目的，并遵守相关法律法规与平台政策

## 浏览器要求

- 必须使用 HTTPS 或 localhost（摄像头访问要求）
- 支持 getUserMedia 的现代浏览器
- 需要授予摄像头权限

## 许可证

MIT © [DouDOU-start](https://github.com/DouDOU-start)
