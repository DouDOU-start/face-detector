import FaceDetectorModule from './face-detector.js';
// import * as embeddedModel from '../models/blazeface/embedded.js'; // Skip embedded model in ESM to avoid CommonJS issues

const FaceDetector = FaceDetectorModule && FaceDetectorModule.default
  ? FaceDetectorModule.default
  : FaceDetectorModule;

const globalScope = typeof globalThis !== 'undefined'
  ? globalThis
  : (typeof window !== 'undefined' ? window : {});
const existingDefaults = globalScope.__FACE_DETECTOR_DEFAULTS || {};

const mergedLibUrls = {
  ...(existingDefaults.libUrls || {})
};
// 构建 libs 文件路径，兼容不同的模块系统和打包工具
let tfAssetUrl, blazeAssetUrl;
try {
  // 在浏览器环境中处理路径
  if (typeof window !== 'undefined' && import.meta.url.includes('node_modules')) {
    // 在 Vite 环境中，使用正确的 node_modules 路径
    const packageName = 'face-detector-lite';
    tfAssetUrl = `/node_modules/${packageName}/libs/tf.min.js`;
    blazeAssetUrl = `/node_modules/${packageName}/libs/blazeface.js`;
  } else {
    // 使用 import.meta.url 构建路径（开发环境）
    tfAssetUrl = new URL('../libs/tf.min.js', import.meta.url).href;
    blazeAssetUrl = new URL('../libs/blazeface.js', import.meta.url).href;
  }
} catch (e) {
  // 回退到相对路径
  tfAssetUrl = '../libs/tf.min.js';
  blazeAssetUrl = '../libs/blazeface.js';
}
if (!mergedLibUrls.tf) mergedLibUrls.tf = tfAssetUrl;
if (!mergedLibUrls.blazeface) mergedLibUrls.blazeface = blazeAssetUrl;

const resolvedDefaults = {
  ...existingDefaults,
  libUrls: mergedLibUrls,
  modelUrl: existingDefaults.modelUrl || '/node_modules/face-detector-lite/models/blazeface/model.json',
  embeddedModel: existingDefaults.embeddedModel || null,
  offlineOnly: typeof existingDefaults.offlineOnly === 'boolean'
    ? existingDefaults.offlineOnly
    : true,
  skipDynamicImports: typeof existingDefaults.skipDynamicImports === 'boolean'
    ? existingDefaults.skipDynamicImports
    : true
};

globalScope.__FACE_DETECTOR_DEFAULTS = resolvedDefaults;

export { FaceDetector };
export default FaceDetector;
