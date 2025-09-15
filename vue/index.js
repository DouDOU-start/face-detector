// Vue 3 wrapper for face-detector-js
import { defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue';
import FD from '../face-detector.js';

// Interop for CJS default export
const FaceDetector = FD && FD.default ? FD.default : FD;

export const FaceDetectorView = defineComponent({
  name: 'FaceDetectorView',
  props: {
    // subset of FaceDetectorOptions (videoContainer handled internally)
    startOnMounted: { type: Boolean, default: true },
    showVideo: { type: Boolean, default: true },
    interval: { type: Number, default: 100 },
    debug: { type: Boolean, default: false },
    modelUrl: { type: [String, Object], default: null },
    libUrls: { type: Object, default: () => ({}) },
    camera: { type: Object, default: () => ({ facingMode: 'user', width: 640, height: 480 }) },
    // presentation
    style: { type: [String, Object], default: '' },
    class: { type: String, default: '' }
  },
  emits: ['initialized', 'detected', 'no-face', 'error'],
  setup(props, { emit, expose }) {
    const containerRef = ref(null);
    let detector = null;

    const init = async () => {
      detector = new FaceDetector({
        showVideo: props.showVideo,
        videoContainer: containerRef.value,
        interval: props.interval,
        debug: props.debug,
        modelUrl: props.modelUrl,
        libUrls: props.libUrls,
        camera: props.camera
      })
        .onInitialized(() => emit('initialized'))
        .onFaceDetected(() => emit('detected'))
        .onNoFace(() => emit('no-face'))
        .onError((e) => emit('error', e));

      await detector.initialize();
      if (props.startOnMounted) detector.startDetection();
    };

    const start = () => detector && detector.startDetection();
    const stop = () => detector && detector.stopDetection();
    const destroy = () => { if (detector) detector.destroy(); detector = null; };

    onMounted(() => { init().catch((e) => emit('error', e)); });
    onBeforeUnmount(() => destroy());

    expose({ start, stop, destroy, get detector() { return detector; } });

    return () => h('div', { ref: containerRef, style: props.style, class: props.class });
  }
});

export default {
  install(app) {
    app.component('FaceDetectorView', FaceDetectorView);
  }
};
