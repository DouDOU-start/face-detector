// Type definitions for face-detector-lite
// Project: face-detector-lite
// Definitions by: Your Team

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export interface FaceDetectorLibUrls {
  tf?: string;
  blazeface?: string;
}

export interface FaceDetectorOptions {
  showVideo?: boolean;
  videoContainer?: string | Element | null;
  interval?: number;
  debug?: boolean;
  modelUrl?: string | any; // TFJS IOHandler or URL string
  libUrls?: FaceDetectorLibUrls;
  camera?: CameraOptions;
}

export type FaceDetectorCallback = () => void;
export type FaceDetectorErrorCallback = (error: unknown) => void;

export default class FaceDetector {
  constructor(options?: FaceDetectorOptions);

  initialize(): Promise<boolean>;
  startDetection(): void;
  stopDetection(): void;
  destroy(): void;
  detectFace(): Promise<boolean>;

  onInitialized(cb: FaceDetectorCallback): this;
  onFaceDetected(cb: FaceDetectorCallback): this;
  onNoFace(cb: FaceDetectorCallback): this;
  onError(cb: FaceDetectorErrorCallback): this;
}

export { FaceDetector };
