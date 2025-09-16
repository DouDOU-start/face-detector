// 直接从 Vue 组件导入，避免加载主 face-detector.js
import VuePlugin, { FaceDetectorView } from '../vue/index.js';

export { FaceDetectorView };
export default VuePlugin;
