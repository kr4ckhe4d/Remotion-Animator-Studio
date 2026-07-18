import { noise2D } from '@remotion/noise';
import { getLength, getPointAtLength, getTangentAtLength } from '@remotion/paths';
import { Easing, interpolate, spring } from 'remotion';
import type { EffectInstance, EffectType, ParamDef } from './types';

/** Named animation curves, selectable on movement effects. */
export const EASING_NAMES = [
  'easeOut',
  'easeIn',
  'easeInOut',
  'linear',
  'bounceOut',
  'elastic',
  'overshoot',
] as const;

export const getEasing = (name: string): ((t: number) => number) => {
  switch (name) {
    case 'linear':
      return Easing.linear;
    case 'easeIn':
      return Easing.in(Easing.cubic);
    case 'easeInOut':
      return Easing.inOut(Easing.cubic);
    case 'bounceOut':
      // Easing.bounce is already the "out" shape (ball settles at the end);
      // wrapping it in Easing.out() would mirror it and bounce at the start.
      return Easing.bounce;
    case 'elastic':
      return Easing.out(Easing.elastic(1.4));
    case 'overshoot':
      return Easing.out(Easing.back(1.7));
    default:
      return Easing.out(Easing.cubic);
  }
};

const EASING_PARAM: ParamDef = {
  key: 'easing',
  label: 'Curve',
  kind: 'select',
  options: [...EASING_NAMES],
};

export interface EffectDef {
  label: string;
  icon: string;
  description: string;
  params: ParamDef[];
  defaults: Record<string, number | string>;
  /** Only applicable to text elements */
  textOnly?: boolean;
  category: 'in' | 'out' | 'loop' | 'style';
}

export const EFFECTS: Record<EffectType, EffectDef> = {
  fadeIn: {
    label: 'Fade In',
    icon: '🌅',
    category: 'in',
    description: 'Fades from transparent at the start',
    params: [{ key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 }],
    defaults: { duration: 15 },
  },
  fadeOut: {
    label: 'Fade Out',
    icon: '🌆',
    category: 'out',
    description: 'Fades to transparent at the end',
    params: [{ key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 }],
    defaults: { duration: 15 },
  },
  slideIn: {
    label: 'Slide In',
    icon: '➡️',
    category: 'in',
    description: 'Slides into place from a direction',
    params: [
      { key: 'direction', label: 'From', kind: 'select', options: ['left', 'right', 'top', 'bottom'] },
      { key: 'distance', label: 'Distance (px)', kind: 'number', min: 20, max: 4000, step: 10 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
      EASING_PARAM,
    ],
    defaults: { direction: 'left', distance: 400, duration: 20, easing: 'easeOut' },
  },
  slideOut: {
    label: 'Slide Out',
    icon: '⬅️',
    category: 'out',
    description: 'Slides away at the end',
    params: [
      { key: 'direction', label: 'To', kind: 'select', options: ['left', 'right', 'top', 'bottom'] },
      { key: 'distance', label: 'Distance (px)', kind: 'number', min: 20, max: 4000, step: 10 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
      EASING_PARAM,
    ],
    defaults: { direction: 'right', distance: 400, duration: 20, easing: 'easeIn' },
  },
  zoomIn: {
    label: 'Zoom In',
    icon: '🔍',
    category: 'in',
    description: 'Scales up from small at the start',
    params: [
      { key: 'fromScale', label: 'Start scale', kind: 'number', min: 0, max: 3, step: 0.05 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
      EASING_PARAM,
    ],
    defaults: { fromScale: 0.3, duration: 20, easing: 'easeOut' },
  },
  zoomOut: {
    label: 'Zoom Out',
    icon: '🔎',
    category: 'out',
    description: 'Scales away at the end',
    params: [
      { key: 'toScale', label: 'End scale', kind: 'number', min: 0, max: 3, step: 0.05 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
      EASING_PARAM,
    ],
    defaults: { toScale: 0.2, duration: 20, easing: 'easeIn' },
  },
  springPop: {
    label: 'Spring Pop',
    icon: '🫧',
    category: 'in',
    description: 'Pops in with a bouncy spring',
    params: [
      { key: 'damping', label: 'Damping', kind: 'number', min: 1, max: 50, step: 1 },
      { key: 'mass', label: 'Mass', kind: 'number', min: 0.1, max: 5, step: 0.1 },
    ],
    defaults: { damping: 10, mass: 0.8 },
  },
  spinIn: {
    label: 'Spin In',
    icon: '🌀',
    category: 'in',
    description: 'Rotates into place at the start',
    params: [
      { key: 'rotations', label: 'Rotations', kind: 'number', min: 0.25, max: 5, step: 0.25 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
    ],
    defaults: { rotations: 1, duration: 25 },
  },
  wipeIn: {
    label: 'Wipe In',
    icon: '🚪',
    category: 'in',
    description: 'Reveals with a directional wipe (like a Resolve transition)',
    params: [
      { key: 'direction', label: 'From', kind: 'select', options: ['left', 'right', 'top', 'bottom'] },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
      EASING_PARAM,
    ],
    defaults: { direction: 'left', duration: 20, easing: 'easeOut' },
  },
  wipeOut: {
    label: 'Wipe Out',
    icon: '🚪',
    category: 'out',
    description: 'Hides with a directional wipe at the end',
    params: [
      { key: 'direction', label: 'To', kind: 'select', options: ['left', 'right', 'top', 'bottom'] },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
      EASING_PARAM,
    ],
    defaults: { direction: 'right', duration: 20, easing: 'easeIn' },
  },
  rotate: {
    label: 'Rotate (loop)',
    icon: '♻️',
    category: 'loop',
    description: 'Continuously rotates',
    params: [{ key: 'rpm', label: 'Speed (RPM)', kind: 'number', min: -120, max: 120, step: 1 }],
    defaults: { rpm: 20 },
  },
  pulse: {
    label: 'Pulse',
    icon: '💓',
    category: 'loop',
    description: 'Rhythmically scales up and down',
    params: [
      { key: 'amount', label: 'Amount', kind: 'number', min: 0.01, max: 1, step: 0.01 },
      { key: 'speed', label: 'Speed (Hz)', kind: 'number', min: 0.1, max: 8, step: 0.1 },
    ],
    defaults: { amount: 0.08, speed: 1.2 },
  },
  wiggle: {
    label: 'Wiggle',
    icon: '🪇',
    category: 'loop',
    description: 'Shakes side to side',
    params: [
      { key: 'amplitude', label: 'Amplitude (px)', kind: 'number', min: 1, max: 200, step: 1 },
      { key: 'speed', label: 'Speed (Hz)', kind: 'number', min: 0.1, max: 12, step: 0.1 },
    ],
    defaults: { amplitude: 10, speed: 3 },
  },
  shake: {
    label: 'Camera Shake',
    icon: '📳',
    category: 'loop',
    description: 'Organic handheld/impact shake driven by noise',
    params: [
      { key: 'intensity', label: 'Intensity (px)', kind: 'number', min: 1, max: 200, step: 1 },
      { key: 'speed', label: 'Speed', kind: 'number', min: 0.1, max: 30, step: 0.1 },
      { key: 'rotation', label: 'Rotation (deg)', kind: 'number', min: 0, max: 45, step: 0.5 },
    ],
    defaults: { intensity: 12, speed: 8, rotation: 1.5 },
  },
  kenBurns: {
    label: 'Ken Burns',
    icon: '🎞️',
    category: 'style',
    description: 'Slow cinematic zoom + pan over the whole clip',
    params: [
      { key: 'zoomFrom', label: 'Zoom from', kind: 'number', min: 0.5, max: 3, step: 0.01 },
      { key: 'zoomTo', label: 'Zoom to', kind: 'number', min: 0.5, max: 3, step: 0.01 },
      { key: 'panX', label: 'Pan X (px)', kind: 'number', min: -1000, max: 1000, step: 5 },
      { key: 'panY', label: 'Pan Y (px)', kind: 'number', min: -1000, max: 1000, step: 5 },
    ],
    defaults: { zoomFrom: 1, zoomTo: 1.18, panX: -60, panY: -30 },
  },
  bounceDrop: {
    label: 'Bounce Drop',
    icon: '🏀',
    category: 'in',
    description: 'Drops in from above and bounces on landing',
    params: [
      { key: 'height', label: 'Drop height (px)', kind: 'number', min: 20, max: 2000, step: 10 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 5, max: 300, step: 1 },
    ],
    defaults: { height: 400, duration: 45 },
  },
  transform: {
    label: 'Transform',
    icon: '🧭',
    category: 'style',
    description: 'Animate position / scale / rotation / opacity from A to B — stack several for multi-step moves',
    params: [
      { key: 'start', label: 'Start at (frame)', kind: 'number', min: 0, max: 600, step: 1 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 600, step: 1 },
      { key: 'fromX', label: 'From X offset', kind: 'number', min: -3000, max: 3000, step: 5 },
      { key: 'toX', label: 'To X offset', kind: 'number', min: -3000, max: 3000, step: 5 },
      { key: 'fromY', label: 'From Y offset', kind: 'number', min: -3000, max: 3000, step: 5 },
      { key: 'toY', label: 'To Y offset', kind: 'number', min: -3000, max: 3000, step: 5 },
      { key: 'fromScale', label: 'From scale', kind: 'number', min: 0, max: 5, step: 0.05 },
      { key: 'toScale', label: 'To scale', kind: 'number', min: 0, max: 5, step: 0.05 },
      { key: 'fromRotate', label: 'From rotation', kind: 'number', min: -720, max: 720, step: 1 },
      { key: 'toRotate', label: 'To rotation', kind: 'number', min: -720, max: 720, step: 1 },
      { key: 'fromOpacity', label: 'From opacity', kind: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'toOpacity', label: 'To opacity', kind: 'number', min: 0, max: 1, step: 0.05 },
      EASING_PARAM,
    ],
    defaults: {
      start: 0,
      duration: 30,
      fromX: 0,
      toX: 200,
      fromY: 0,
      toY: 0,
      fromScale: 1,
      toScale: 1,
      fromRotate: 0,
      toRotate: 0,
      fromOpacity: 1,
      toOpacity: 1,
      easing: 'easeInOut',
    },
  },
  motionPath: {
    label: 'Motion Path',
    icon: '🛤️',
    category: 'style',
    description: 'Move along any SVG path over the clip (uses @remotion/paths)',
    params: [
      { key: 'path', label: 'SVG path', kind: 'text' },
      { key: 'orient', label: 'Rotate to follow path', kind: 'select', options: ['no', 'yes'] },
      EASING_PARAM,
    ],
    defaults: { path: 'M 0 0 C 150 -250 450 -250 600 0', orient: 'no', easing: 'easeInOut' },
  },
  drift: {
    label: 'Drift',
    icon: '🛝',
    category: 'style',
    description: 'Constant linear movement over the whole clip (tickers, clouds…)',
    params: [
      { key: 'dx', label: 'Move X (px)', kind: 'number', min: -6000, max: 6000, step: 10 },
      { key: 'dy', label: 'Move Y (px)', kind: 'number', min: -6000, max: 6000, step: 10 },
    ],
    defaults: { dx: -1200, dy: 0 },
  },
  blurIn: {
    label: 'Blur In',
    icon: '🌫️',
    category: 'in',
    description: 'Sharpens from a blur at the start',
    params: [
      { key: 'startBlur', label: 'Start blur (px)', kind: 'number', min: 1, max: 120, step: 1 },
      { key: 'duration', label: 'Duration (frames)', kind: 'number', min: 1, max: 300, step: 1 },
    ],
    defaults: { startBlur: 20, duration: 20 },
  },
  glow: {
    label: 'Glow',
    icon: '✨',
    category: 'style',
    description: 'Soft neon glow around the element',
    params: [
      { key: 'color', label: 'Color', kind: 'color' },
      { key: 'radius', label: 'Radius (px)', kind: 'number', min: 1, max: 120, step: 1 },
      { key: 'pulseSpeed', label: 'Pulse (Hz, 0 = off)', kind: 'number', min: 0, max: 6, step: 0.1 },
    ],
    defaults: { color: '#7c5cff', radius: 25, pulseSpeed: 0 },
  },
  shadow: {
    label: 'Drop Shadow',
    icon: '🌑',
    category: 'style',
    description: 'Classic drop shadow',
    params: [
      { key: 'offsetX', label: 'Offset X', kind: 'number', min: -100, max: 100, step: 1 },
      { key: 'offsetY', label: 'Offset Y', kind: 'number', min: -100, max: 100, step: 1 },
      { key: 'blur', label: 'Blur', kind: 'number', min: 0, max: 120, step: 1 },
      { key: 'color', label: 'Color', kind: 'color' },
    ],
    defaults: { offsetX: 0, offsetY: 14, blur: 24, color: '#000000' },
  },
  rgbSplit: {
    label: 'RGB Split',
    icon: '🔴',
    category: 'style',
    description: 'Chromatic aberration — red/cyan channel offset',
    params: [
      { key: 'amount', label: 'Amount (px)', kind: 'number', min: 0, max: 60, step: 0.5 },
      { key: 'jitter', label: 'Jitter (0 = steady)', kind: 'number', min: 0, max: 10, step: 0.1 },
    ],
    defaults: { amount: 6, jitter: 0 },
  },
  glitch: {
    label: 'Glitch',
    icon: '📺',
    category: 'style',
    description: 'Digital glitch — random slice displacement + color split',
    params: [
      { key: 'intensity', label: 'Intensity', kind: 'number', min: 0.05, max: 1, step: 0.05 },
      { key: 'frequency', label: 'Frequency', kind: 'number', min: 0.1, max: 1, step: 0.05 },
    ],
    defaults: { intensity: 0.5, frequency: 0.4 },
  },
  shine: {
    label: 'Light Sweep',
    icon: '🔦',
    category: 'loop',
    description: 'A light streak sweeps across (logo shine)',
    params: [
      { key: 'period', label: 'Period (s)', kind: 'number', min: 0.5, max: 10, step: 0.1 },
      { key: 'strength', label: 'Strength', kind: 'number', min: 0.1, max: 1, step: 0.05 },
    ],
    defaults: { period: 2.5, strength: 0.5 },
  },
  strobe: {
    label: 'Strobe',
    icon: '⚡',
    category: 'loop',
    description: 'Flashes the element on and off',
    params: [
      { key: 'speed', label: 'Speed (Hz)', kind: 'number', min: 0.5, max: 15, step: 0.5 },
      { key: 'minOpacity', label: 'Low opacity', kind: 'number', min: 0, max: 1, step: 0.05 },
    ],
    defaults: { speed: 4, minOpacity: 0.1 },
  },
  typewriter: {
    label: 'Typewriter',
    icon: '⌨️',
    category: 'in',
    description: 'Types text character by character',
    params: [{ key: 'charsPerSecond', label: 'Chars / second', kind: 'number', min: 1, max: 120, step: 1 }],
    defaults: { charsPerSecond: 20 },
    textOnly: true,
  },
  letterPop: {
    label: 'Letter Pop',
    icon: '🔤',
    category: 'in',
    description: 'Letters spring in one after another',
    params: [
      { key: 'stagger', label: 'Stagger (frames/letter)', kind: 'number', min: 0.5, max: 15, step: 0.5 },
      { key: 'duration', label: 'Per-letter duration', kind: 'number', min: 2, max: 60, step: 1 },
      { key: 'distance', label: 'Rise distance (px)', kind: 'number', min: 0, max: 300, step: 5 },
    ],
    defaults: { stagger: 2, duration: 14, distance: 40 },
    textOnly: true,
  },
};

const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export interface ComputedStyle {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
  blur: number;
  /** Additional CSS filter() terms (glow, shadow, rgb split) */
  extraFilters: string[];
  /** clip-path for wipes */
  clipPath: string | null;
  /** 0..1 sweep progress for the light-sweep overlay, or null */
  shine: { progress: number; strength: number } | null;
  /** glitch layer config, or null */
  glitch: { intensity: number; frequency: number } | null;
}

export const effectParams = (e: EffectInstance): Record<string, any> => ({
  ...EFFECTS[e.type].defaults,
  ...e.params,
});

const wipeClip = (direction: string, t: number): string => {
  const pct = `${(1 - t) * 100}%`;
  switch (direction) {
    case 'left':
      return `inset(0 ${pct} 0 0)`;
    case 'right':
      return `inset(0 0 0 ${pct})`;
    case 'top':
      return `inset(0 0 ${pct} 0)`;
    default:
      return `inset(${pct} 0 0 0)`;
  }
};

/**
 * Combine all effects on a clip into a single set of style values.
 * `frame` is relative to the start of the clip.
 */
export const computeEffectStyle = (
  frame: number,
  clipDuration: number,
  fps: number,
  effects: EffectInstance[],
): ComputedStyle => {
  const out: ComputedStyle = {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotate: 0,
    blur: 0,
    extraFilters: [],
    clipPath: null,
    shine: null,
    glitch: null,
  };

  for (const e of effects) {
    const p = effectParams(e);
    switch (e.type) {
      case 'fadeIn':
        out.opacity *= interpolate(frame, [0, Number(p.duration)], [0, 1], clampOpts);
        break;
      case 'fadeOut':
        out.opacity *= interpolate(frame, [clipDuration - Number(p.duration), clipDuration], [1, 0], clampOpts);
        break;
      case 'slideIn': {
        const t = interpolate(frame, [0, Number(p.duration)], [0, 1], {
          ...clampOpts,
          easing: getEasing(String(p.easing ?? 'easeOut')),
        });
        const d = (1 - t) * Number(p.distance);
        if (p.direction === 'left') out.translateX -= d;
        if (p.direction === 'right') out.translateX += d;
        if (p.direction === 'top') out.translateY -= d;
        if (p.direction === 'bottom') out.translateY += d;
        break;
      }
      case 'slideOut': {
        const t = interpolate(frame, [clipDuration - Number(p.duration), clipDuration], [0, 1], {
          ...clampOpts,
          easing: getEasing(String(p.easing ?? 'easeIn')),
        });
        const d = t * Number(p.distance);
        if (p.direction === 'left') out.translateX -= d;
        if (p.direction === 'right') out.translateX += d;
        if (p.direction === 'top') out.translateY -= d;
        if (p.direction === 'bottom') out.translateY += d;
        break;
      }
      case 'zoomIn': {
        out.scale *= interpolate(frame, [0, Number(p.duration)], [Number(p.fromScale), 1], {
          ...clampOpts,
          easing: getEasing(String(p.easing ?? 'easeOut')),
        });
        break;
      }
      case 'zoomOut': {
        out.scale *= interpolate(frame, [clipDuration - Number(p.duration), clipDuration], [1, Number(p.toScale)], {
          ...clampOpts,
          easing: getEasing(String(p.easing ?? 'easeIn')),
        });
        break;
      }
      case 'springPop':
        out.scale *= spring({ frame, fps, config: { damping: Number(p.damping), mass: Number(p.mass) } });
        break;
      case 'spinIn': {
        const t = interpolate(frame, [0, Number(p.duration)], [0, 1], {
          ...clampOpts,
          easing: Easing.out(Easing.cubic),
        });
        out.rotate += (1 - t) * 360 * Number(p.rotations);
        break;
      }
      case 'wipeIn': {
        const t = interpolate(frame, [0, Number(p.duration)], [0, 1], {
          ...clampOpts,
          easing: getEasing(String(p.easing ?? 'easeOut')),
        });
        out.clipPath = wipeClip(String(p.direction), t);
        break;
      }
      case 'wipeOut': {
        const t = interpolate(frame, [clipDuration - Number(p.duration), clipDuration], [1, 0], {
          ...clampOpts,
          easing: getEasing(String(p.easing ?? 'easeIn')),
        });
        // reuse wipeClip but mirror the direction so it exits toward `direction`
        const mirror: Record<string, string> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
        out.clipPath = wipeClip(mirror[String(p.direction)] ?? 'left', t);
        break;
      }
      case 'rotate':
        out.rotate += (frame / fps) * 6 * Number(p.rpm);
        break;
      case 'pulse':
        out.scale *= 1 + Math.sin((frame / fps) * Number(p.speed) * Math.PI * 2) * Number(p.amount);
        break;
      case 'wiggle':
        out.translateX += Math.sin((frame / fps) * Number(p.speed) * Math.PI * 2) * Number(p.amplitude);
        break;
      case 'shake': {
        const t = (frame / fps) * Number(p.speed);
        out.translateX += noise2D('shake-x', t, 0) * Number(p.intensity);
        out.translateY += noise2D('shake-y', t, 7) * Number(p.intensity);
        out.rotate += noise2D('shake-r', t, 13) * Number(p.rotation);
        break;
      }
      case 'kenBurns': {
        const t = clipDuration > 0 ? Math.min(1, frame / clipDuration) : 0;
        out.scale *= Number(p.zoomFrom) + (Number(p.zoomTo) - Number(p.zoomFrom)) * t;
        out.translateX += Number(p.panX) * t;
        out.translateY += Number(p.panY) * t;
        break;
      }
      case 'bounceDrop': {
        const t = Math.max(0, Math.min(1, frame / Number(p.duration)));
        out.translateY -= (1 - Easing.bounce(t)) * Number(p.height);
        break;
      }
      case 'transform': {
        const t = interpolate(frame, [Number(p.start), Number(p.start) + Number(p.duration)], [0, 1], {
          ...clampOpts,
          easing: getEasing(String(p.easing ?? 'easeInOut')),
        });
        const lerp = (a: number, b: number) => a + (b - a) * t;
        out.translateX += lerp(Number(p.fromX), Number(p.toX));
        out.translateY += lerp(Number(p.fromY), Number(p.toY));
        out.scale *= lerp(Number(p.fromScale), Number(p.toScale));
        out.rotate += lerp(Number(p.fromRotate), Number(p.toRotate));
        out.opacity *= lerp(Number(p.fromOpacity), Number(p.toOpacity));
        break;
      }
      case 'motionPath': {
        try {
          const d = String(p.path);
          const length = getLength(d);
          const t = getEasing(String(p.easing ?? 'easeInOut'))(
            Math.max(0, Math.min(1, clipDuration > 0 ? frame / clipDuration : 0)),
          );
          const pt = getPointAtLength(d, t * length);
          const start = getPointAtLength(d, 0);
          out.translateX += pt.x - start.x;
          out.translateY += pt.y - start.y;
          if (p.orient === 'yes') {
            const tan = getTangentAtLength(d, t * length);
            out.rotate += (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
          }
        } catch {
          /* invalid SVG path — ignore until it parses */
        }
        break;
      }
      case 'drift': {
        const t = clipDuration > 0 ? frame / clipDuration : 0;
        out.translateX += Number(p.dx) * t;
        out.translateY += Number(p.dy) * t;
        break;
      }
      case 'blurIn':
        out.blur = Math.max(
          out.blur,
          interpolate(frame, [0, Number(p.duration)], [Number(p.startBlur), 0], clampOpts),
        );
        break;
      case 'glow': {
        let r = Number(p.radius);
        if (Number(p.pulseSpeed) > 0) {
          r *= 0.7 + 0.3 * Math.sin((frame / fps) * Number(p.pulseSpeed) * Math.PI * 2);
        }
        out.extraFilters.push(`drop-shadow(0 0 ${r}px ${p.color})`, `drop-shadow(0 0 ${r * 2}px ${p.color})`);
        break;
      }
      case 'shadow':
        out.extraFilters.push(`drop-shadow(${p.offsetX}px ${p.offsetY}px ${p.blur}px ${p.color})`);
        break;
      case 'rgbSplit': {
        let a = Number(p.amount);
        if (Number(p.jitter) > 0) {
          a += noise2D('rgb-jitter', (frame / fps) * 10, 0) * Number(p.jitter);
        }
        out.extraFilters.push(
          `drop-shadow(${a}px 0 0 rgba(255,0,60,0.65))`,
          `drop-shadow(${-a}px 0 0 rgba(0,255,255,0.65))`,
        );
        break;
      }
      case 'glitch':
        out.glitch = { intensity: Number(p.intensity), frequency: Number(p.frequency) };
        break;
      case 'shine': {
        const period = Math.max(0.1, Number(p.period));
        out.shine = { progress: ((frame / fps) % period) / period, strength: Number(p.strength) };
        break;
      }
      case 'strobe': {
        const on = Math.floor((frame / fps) * Number(p.speed) * 2) % 2 === 0;
        if (!on) out.opacity *= Number(p.minOpacity);
        break;
      }
      case 'typewriter':
      case 'letterPop':
        // Handled inside the Text element renderer.
        break;
    }
  }
  return out;
};

/** How many characters of text are visible, given a typewriter effect (if any). */
export const typewriterChars = (
  frame: number,
  fps: number,
  effects: EffectInstance[],
  totalChars: number,
): number => {
  const tw = effects.find((e) => e.type === 'typewriter');
  if (!tw) return totalChars;
  const cps = Number(effectParams(tw).charsPerSecond);
  return Math.min(totalChars, Math.floor((frame / fps) * cps));
};
