import type { DefineComponent, Plugin } from 'vue';
import type { FaceDetectorOptions } from '..';

export interface FaceDetectorViewProps extends Omit<FaceDetectorOptions, 'videoContainer' | 'showVideo'> {
  /** Initialize and start on mount */
  startOnMounted?: boolean;
  /** Show the video stream in the component */
  showVideo?: boolean;
  /** Render container when showVideo=false */
  renderContainer?: boolean;
  /** Inline style for container element */
  style?: string | Record<string, string>;
  /** Class for container element */
  class?: string;
}

export const FaceDetectorView: DefineComponent<FaceDetectorViewProps>;

declare const FaceDetectorPlugin: Plugin;
export default FaceDetectorPlugin;
