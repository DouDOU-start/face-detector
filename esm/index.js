import FaceDetectorModule from '../face-detector.js';
import embeddedModel from '../models/blazeface/embedded.js';

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
const tfAssetUrl = new URL('../libs/tf.min.js', import.meta.url).href;
const blazeAssetUrl = new URL('../libs/blazeface.js', import.meta.url).href;
if (!mergedLibUrls.tf) mergedLibUrls.tf = tfAssetUrl;
if (!mergedLibUrls.blazeface) mergedLibUrls.blazeface = blazeAssetUrl;

const resolvedDefaults = {
  ...existingDefaults,
  libUrls: mergedLibUrls,
  embeddedModel: existingDefaults.embeddedModel || embeddedModel,
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
