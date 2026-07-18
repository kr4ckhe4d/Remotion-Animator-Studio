export type ElementType =
  | 'text'
  | 'shape'
  | 'image'
  | 'emoji'
  | 'background'
  | 'video'
  | 'audio'
  | 'gif'
  | 'counter'
  | 'wave'
  | 'blob'
  | 'particles';

export type EffectType =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideIn'
  | 'slideOut'
  | 'zoomIn'
  | 'zoomOut'
  | 'springPop'
  | 'spinIn'
  | 'rotate'
  | 'pulse'
  | 'wiggle'
  | 'blurIn'
  | 'typewriter'
  | 'wipeIn'
  | 'wipeOut'
  | 'kenBurns'
  | 'shake'
  | 'glitch'
  | 'rgbSplit'
  | 'glow'
  | 'shadow'
  | 'shine'
  | 'strobe'
  | 'letterPop'
  | 'drift'
  | 'transform'
  | 'motionPath'
  | 'bounceDrop';

export interface EffectInstance {
  id: string;
  type: EffectType;
  params: Record<string, number | string>;
}

export interface Clip {
  id: string;
  name: string;
  element: ElementType;
  /** Start frame within the composition */
  from: number;
  durationInFrames: number;
  props: Record<string, any>;
  effects: EffectInstance[];
}

export interface Track {
  id: string;
  name: string;
  clips: Clip[];
}

export interface Project {
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  backgroundColor: string;
  /** tracks[0] renders on top (like layers) */
  tracks: Track[];
}

export interface ParamDef {
  key: string;
  label: string;
  kind: 'number' | 'color' | 'text' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}
