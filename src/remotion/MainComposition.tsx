import { Gif } from '@remotion/gif';
import { Circle, Ellipse, Pie, Polygon, Star, Triangle } from '@remotion/shapes';
import { noise2D } from '@remotion/noise';
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { computeEffectStyle, effectParams, typewriterChars, type ComputedStyle } from '../effects';
import type { Clip, Project } from '../types';
import { CommitGraph, IsoCity, NeonSun, NodeTrail, Ridge, SkyCycle, SunMoon, SynthGrid } from './scenes';

/** Letters riding a sine wave; `gain` scales amplitude (1 = manual, >1 = audio-driven). */
const WavyLetters: React.FC<{
  full: string;
  baseStyle: React.CSSProperties;
  textureStyle: React.CSSProperties;
  amplitude: number;
  wavelength: number;
  speed: number;
  gain: number;
}> = ({ full, baseStyle, textureStyle, amplitude, wavelength, speed, gain }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={baseStyle}>
      {full.split('').map((ch, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
            transform: `translateY(${
              Math.sin((frame / fps) * speed * Math.PI * 2 + (i / Math.max(0.5, wavelength)) * Math.PI * 2) *
              amplitude *
              gain
            }px)`,
            ...textureStyle,
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
};

/** Same, but amplitude follows the bass of an audio file. */
const AudioWavyLetters: React.FC<{
  src: string;
  audioGain: number;
  full: string;
  baseStyle: React.CSSProperties;
  textureStyle: React.CSSProperties;
  amplitude: number;
  wavelength: number;
  speed: number;
}> = ({ src, audioGain, ...rest }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(src);
  let gain = 1;
  if (audioData) {
    const freqs = visualizeAudio({ fps, frame, audioData, numberOfSamples: 32 });
    const bass = (freqs[1] + freqs[2] + freqs[3]) / 3;
    gain = 0.3 + bass * audioGain;
  }
  return <WavyLetters {...rest} gain={gain} />;
};

const TextContent: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;
  const full = String(p.text ?? '');

  const baseStyle: React.CSSProperties = {
    fontSize: p.fontSize,
    color: p.color,
    fontFamily: p.fontFamily,
    fontWeight: Number(p.fontWeight),
    letterSpacing: p.letterSpacing,
    whiteSpace: 'pre',
    textAlign: 'center',
  };
  // texture-masked typography: an image fills the letters (background-clip: text)
  const textureStyle: React.CSSProperties = p.textureSrc
    ? {
        // a CSS gradient() works too — reliable in renders since it needs no network fetch
        backgroundImage: String(p.textureSrc).includes('gradient(')
          ? String(p.textureSrc)
          : `url(${p.textureSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }
    : {};

  const letterFx = clip.effects.find((e) => e.type === 'letterPop');
  if (letterFx) {
    const lp = effectParams(letterFx);
    // background-clip:text can't paint into transformed children,
    // so with letter animation the texture is applied per letter
    return (
      <div style={baseStyle}>
        {full.split('').map((ch, i) => {
          const local = frame - i * Number(lp.stagger);
          const prog = spring({
            frame: Math.max(0, local),
            fps,
            config: { damping: 12, mass: 0.7 },
            durationInFrames: Number(lp.duration) * 2,
          });
          const visible = local >= 0;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                opacity: visible ? Math.min(1, prog * 1.5) : 0,
                transform: `translateY(${(1 - prog) * Number(lp.distance)}px)`,
                ...textureStyle,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    );
  }

  const waveFx = clip.effects.find((e) => e.type === 'letterWave');
  if (waveFx) {
    const lw = effectParams(waveFx);
    const waveProps = {
      full,
      baseStyle,
      textureStyle,
      amplitude: Number(lw.amplitude),
      wavelength: Number(lw.wavelength),
      speed: Number(lw.speed),
    };
    return String(lw.audioSrc).trim() ? (
      <AudioWavyLetters src={String(lw.audioSrc).trim()} audioGain={Number(lw.audioGain)} {...waveProps} />
    ) : (
      <WavyLetters {...waveProps} gain={1} />
    );
  }

  const visible = full.slice(0, typewriterChars(frame, fps, clip.effects, full.length));
  return <div style={{ ...baseStyle, ...textureStyle }}>{visible}</div>;
};

const ShapeContent: React.FC<{ clip: Clip }> = ({ clip }) => {
  const p = clip.props;
  const w = Number(p.width);
  const h = Number(p.height);
  const common = { fill: p.fill } as const;
  let shape: React.ReactNode;

  switch (p.kind) {
    case 'circle':
      shape = <Circle radius={Math.min(w, h) / 2} {...common} />;
      break;
    case 'ellipse':
      shape = <Ellipse rx={w / 2} ry={h / 2} {...common} />;
      break;
    case 'triangle':
      shape = <Triangle length={w} direction={p.direction ?? 'up'} {...common} />;
      break;
    case 'star':
      shape = (
        <Star
          points={Number(p.points) || 5}
          innerRadius={(w / 2) * Number(p.innerRatio ?? 0.5)}
          outerRadius={w / 2}
          {...common}
        />
      );
      break;
    case 'polygon':
      shape = <Polygon points={Number(p.points) || 6} radius={w / 2} {...common} />;
      break;
    case 'pie':
      shape = <Pie radius={w / 2} progress={Number(p.progress ?? 0.75)} {...common} />;
      break;
    default:
      shape = <div style={{ width: w, height: h, background: p.fill, borderRadius: p.borderRadius }} />;
  }

  return <div style={{ opacity: p.opacity, transform: `rotate(${p.rotation}deg)` }}>{shape}</div>;
};

const WaveContent: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;
  const w = Number(p.width);
  const h = Number(p.height);
  const layers = Math.max(1, Math.round(Number(p.layers)));
  const steps = 48;

  const paths: string[] = [];
  for (let l = 0; l < layers; l++) {
    const amp = Number(p.amplitude) * (1 - l * 0.18);
    const wl = Number(p.wavelength) * (1 + l * 0.35);
    const phase = (frame / fps) * Number(p.speed) * Math.PI * 2 + l * 1.4;
    const base = h * 0.35 + l * (h * 0.12);
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const x = (w / steps) * i;
      const y = base + Math.sin((x / wl) * Math.PI * 2 + phase) * amp;
      d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    d += `L ${w} ${h} L 0 ${h} Z`;
    paths.push(d);
  }

  return (
    <svg width={w} height={h} style={{ opacity: p.opacity, display: 'block' }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={p.color} opacity={0.85 / (i + 1) + 0.15} />
      ))}
    </svg>
  );
};

const BlobContent: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;
  const size = Number(p.size);
  const pts = Math.max(4, Math.round(Number(p.points)));
  const wobble = Number(p.wobble);
  const t = (frame / fps) * Number(p.speed);
  const seed = String(p.seed ?? 'blob');

  const points = Array.from({ length: pts }, (_, k) => {
    const angle = (k / pts) * Math.PI * 2;
    const r = (size / 2) * (1 - wobble * 0.35 + wobble * 0.35 * noise2D(`${seed}-${k}`, t, k * 3));
    return { x: size / 2 + Math.cos(angle) * r, y: size / 2 + Math.sin(angle) * r };
  });

  // Smooth closed path through midpoints (classic blob technique)
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });
  const m0 = mid(points[0], points[1]);
  let d = `M ${m0.x.toFixed(1)} ${m0.y.toFixed(1)}`;
  for (let k = 1; k <= pts; k++) {
    const p1 = points[k % pts];
    const p2 = points[(k + 1) % pts];
    const m = mid(p1, p2);
    d += ` Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)}`;
  }
  d += ' Z';

  return (
    <svg width={size} height={size} style={{ opacity: p.opacity, display: 'block' }}>
      <path d={d} fill={p.color} />
    </svg>
  );
};

/** Deterministic per-particle random in [0,1) — same on every render of the same frame. */
const prand = (seed: string, i: number, salt: number) => (noise2D(`${seed}-${salt}`, i * 1.618, salt * 2.39) + 1) / 2;

const mod = (n: number, m: number) => ((n % m) + m) % m;

const ParticlesContent: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;
  const W = Number(p.width);
  const H = Number(p.height);
  const count = Math.min(300, Math.max(1, Math.round(Number(p.count))));
  const size = Number(p.size);
  const speed = Number(p.speed);
  const drift = Number(p.drift);
  const seed = String(p.seed ?? 'p');
  const colors = String(p.colors ?? '#ffffff')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const t = frame / fps;
  const kind = String(p.kind);

  const parts: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const r1 = prand(seed, i, 1); // base x
    const r2 = prand(seed, i, 2); // base y / phase
    const r3 = prand(seed, i, 3); // size variance
    const r4 = prand(seed, i, 4); // rotation / twinkle speed
    const color = colors[i % colors.length] ?? '#ffffff';
    const s = size * (0.5 + r3);
    const sway = Math.sin(t * (0.5 + r4 * 1.5) * Math.PI * 2 + r2 * 10) * drift;

    let node: React.ReactNode = null;
    if (p.imageSrc) {
      // custom PNG/SVG particles — motion style follows the chosen type
      const rising = kind === 'bubbles' || kind === 'embers';
      const still = kind === 'scatter' || kind === 'sparkles';
      const fallSpeed = kind === 'rain' ? 0.9 : kind === 'snow' ? 0.12 : 0.25;
      let x: number;
      let y: number;
      if (still) {
        x = r1 * W;
        y = r2 * H;
      } else {
        const yy = mod(r2 * H + t * speed * H * fallSpeed, H + s * 2) - s;
        y = rising ? H - yy : yy;
        x = mod(r1 * W + sway, W);
      }
      const rot =
        kind === 'confetti'
          ? r4 * 360 + t * (r1 > 0.5 ? 1 : -1) * 360 * speed
          : kind === 'scatter'
            ? (r4 - 0.5) * 70
            : 0;
      const tw = kind === 'sparkles' ? Math.max(0.15, Math.sin(t * (0.5 + r4 * 2) * Math.PI * 2 + r2 * 20)) : 1;
      node = (
        <Img
          key={i}
          src={p.imageSrc}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: s,
            height: s,
            objectFit: 'contain',
            transform: `rotate(${rot}deg)`,
            opacity: tw,
          }}
        />
      );
    } else if (kind === 'scatter') {
      // static decorative scatter — stars in a sky, sprinkles on a donut
      node = (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r1 * W,
            top: r2 * H,
            width: s,
            height: s * 0.4,
            background: color,
            borderRadius: s,
            transform: `rotate(${Math.round((r4 - 0.5) * 180)}deg)`,
            opacity: 0.6 + r3 * 0.4,
          }}
        />
      );
    } else if (kind === 'confetti') {
      const y = mod(r2 * H + t * speed * H * 0.25, H + s * 2) - s;
      const x = mod(r1 * W + sway, W);
      const rot = r4 * 360 + t * (r1 > 0.5 ? 1 : -1) * 360 * speed;
      node = (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: s,
            height: s * 0.55,
            background: color,
            borderRadius: 2,
            transform: `rotate(${rot}deg)`,
          }}
        />
      );
    } else if (kind === 'snow') {
      const y = mod(r2 * H + t * speed * H * 0.12, H + s * 2) - s;
      const x = mod(r1 * W + sway, W);
      node = (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: s * 0.5,
            height: s * 0.5,
            background: '#ffffff',
            opacity: 0.4 + r3 * 0.6,
            borderRadius: '50%',
          }}
        />
      );
    } else if (kind === 'rain') {
      const y = mod(r2 * H + t * speed * H * 0.9, H + s * 3) - s;
      const x = mod(r1 * W + t * speed * drift, W);
      node = (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 2,
            height: s * 1.6,
            background: color,
            opacity: 0.35 + r3 * 0.4,
            transform: `rotate(${drift > 0 ? -8 : 0}deg)`,
          }}
        />
      );
    } else if (kind === 'sparkles') {
      const tw = Math.max(0, Math.sin(t * (0.5 + r4 * 2) * Math.PI * 2 + r2 * 20));
      node = (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r1 * W,
            top: r2 * H,
            fontSize: s,
            lineHeight: 1,
            color,
            opacity: tw,
            transform: `scale(${0.6 + tw * 0.6})`,
          }}
        >
          ✦
        </div>
      );
    } else if (kind === 'bubbles') {
      const y = H - (mod(r2 * H + t * speed * H * 0.15, H + s * 2) - s);
      const x = mod(r1 * W + sway, W);
      node = (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: s,
            height: s,
            border: `2px solid ${color}`,
            opacity: 0.5,
            borderRadius: '50%',
          }}
        />
      );
    } else {
      // embers: rise slowly and fade out near the top
      const prog = mod(r2 + t * speed * 0.12, 1);
      const y = H - prog * H;
      const x = mod(r1 * W + sway, W);
      node = (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: s * 0.4,
            height: s * 0.4,
            background: color,
            borderRadius: '50%',
            opacity: Math.max(0, 1 - prog) * (0.5 + r3 * 0.5),
            boxShadow: `0 0 ${s * 0.6}px ${color}`,
          }}
        />
      );
    }
    parts.push(node);
  }

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', opacity: p.opacity }}>
      {parts}
    </div>
  );
};

const ElementContent: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;

  switch (clip.element) {
    case 'text':
      return <TextContent clip={clip} />;
    case 'counter': {
      const value = interpolate(frame, [0, Math.max(1, clip.durationInFrames - 1)], [Number(p.from), Number(p.to)], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return (
        <div
          style={{
            fontSize: p.fontSize,
            color: p.color,
            fontFamily: p.fontFamily,
            fontWeight: Number(p.fontWeight),
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'pre',
          }}
        >
          {p.prefix}
          {value.toFixed(Number(p.decimals))}
          {p.suffix}
        </div>
      );
    }
    case 'shape':
      return <ShapeContent clip={clip} />;
    case 'wave':
      return <WaveContent clip={clip} />;
    case 'blob':
      return <BlobContent clip={clip} />;
    case 'particles':
      return <ParticlesContent clip={clip} />;
    case 'html':
      return (
        <div style={{ width: Number(p.width), height: Number(p.height), opacity: p.opacity, overflow: 'hidden' }}>
          <div
            style={{
              width: `${100 / Number(p.contentScale || 1)}%`,
              height: `${100 / Number(p.contentScale || 1)}%`,
              transform: `scale(${p.contentScale || 1})`,
              transformOrigin: 'top left',
            }}
            dangerouslySetInnerHTML={{ __html: String(p.html ?? '') }}
          />
        </div>
      );
    case 'synthGrid':
      return <SynthGrid clip={clip} />;
    case 'neonSun':
      return <NeonSun clip={clip} />;
    case 'isoCity':
      return <IsoCity clip={clip} />;
    case 'skyCycle':
      return <SkyCycle clip={clip} />;
    case 'sunMoon':
      return <SunMoon clip={clip} />;
    case 'ridge':
      return <Ridge clip={clip} />;
    case 'commitGraph':
      return <CommitGraph clip={clip} />;
    case 'nodeTrail':
      return <NodeTrail clip={clip} />;
    case 'cursor':
      return (
        <svg
          width={Number(p.size)}
          height={Number(p.size)}
          viewBox="0 0 24 24"
          style={{ display: 'block', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
        >
          <path
            d="M5 2 L5 20.5 L9.8 16.2 L12.6 22.5 L15.6 21.2 L12.8 15 L19 14.6 Z"
            fill={p.color}
            stroke="#111"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'image':
      return (
        <Img
          src={p.src}
          style={{
            width: p.width,
            height: p.height,
            borderRadius: p.borderRadius,
            objectFit: p.objectFit,
            opacity: p.opacity,
          }}
        />
      );
    case 'video':
      return (
        <OffthreadVideo
          src={p.src}
          volume={Number(p.volume)}
          playbackRate={Number(p.playbackRate) || 1}
          startFrom={Number(p.startFrom) || 0}
          muted={p.muted === 'yes'}
          style={{
            width: p.width,
            height: p.height,
            borderRadius: p.borderRadius,
            objectFit: p.objectFit,
            opacity: p.opacity,
          }}
        />
      );
    case 'gif':
      return (
        <Gif
          src={p.src}
          width={Number(p.width)}
          height={Number(p.height)}
          fit={p.fit}
          style={{ opacity: p.opacity }}
        />
      );
    case 'emoji':
      return <div style={{ fontSize: p.size, lineHeight: 1 }}>{p.char}</div>;
    case 'audio':
    case 'background':
      return null;
  }
};

/** Renders glitch slice copies on top of the content when the glitch gate is open. */
const GlitchLayers: React.FC<{
  cfg: NonNullable<ComputedStyle['glitch']>;
  children: React.ReactNode;
}> = ({ cfg, children }) => {
  const frame = useCurrentFrame();
  const bucket = Math.floor(frame / 3);
  const gate = (noise2D('glitch-gate', bucket, 0) + 1) / 2 < cfg.frequency;
  if (!gate) return null;

  const slices = [0, 1, 2].map((i) => {
    const top = ((noise2D('gl-top', bucket, i * 3) + 1) / 2) * 80;
    const height = 6 + ((noise2D('gl-h', bucket, i * 5) + 1) / 2) * 18;
    const dx = noise2D('gl-dx', bucket, i * 7) * 60 * cfg.intensity;
    return { top, height, dx, i };
  });

  return (
    <>
      {slices.map(({ top, height, dx, i }) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - height)}% 0)`,
            transform: `translateX(${dx}px)`,
            filter: i === 1 ? 'hue-rotate(90deg)' : undefined,
          }}
        >
          {children}
        </div>
      ))}
    </>
  );
};

const ClipRenderer: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fx = computeEffectStyle(frame, clip.durationInFrames, fps, clip.effects);
  const p = clip.props;

  if (clip.element === 'audio') {
    return p.src ? (
      <Audio
        src={p.src}
        volume={Number(p.volume)}
        playbackRate={Number(p.playbackRate) || 1}
        startFrom={Number(p.startFrom) || 0}
      />
    ) : null;
  }

  const filters = [...(fx.blur > 0.01 ? [`blur(${fx.blur}px)`] : []), ...fx.extraFilters];

  if (clip.element === 'background') {
    const bg =
      p.fillType === 'solid'
        ? p.colorA
        : p.fillType === 'radial'
          ? `radial-gradient(circle at 50% 50%, ${p.colorA}, ${p.colorB})`
          : `linear-gradient(${p.angle}deg, ${p.colorA}, ${p.colorB})`;
    return (
      <AbsoluteFill
        style={{
          background: bg,
          opacity: fx.opacity,
          filter: filters.length ? filters.join(' ') : undefined,
          clipPath: fx.clipPath ?? undefined,
          transform: `scale(${fx.scale})`,
        }}
      />
    );
  }

  const content = <ElementContent clip={clip} />;

  return (
    <div
      style={{
        position: 'absolute',
        left: p.x,
        top: p.y,
        opacity: fx.opacity,
        filter: filters.length ? filters.join(' ') : undefined,
        clipPath: fx.clipPath ?? undefined,
        transform:
          `translate(-50%, -50%) translate(${fx.translateX}px, ${fx.translateY}px) scale(${fx.scale}) rotate(${fx.rotate}deg)` +
          (fx.rotateX !== 0 || fx.rotateY !== 0
            ? ` perspective(1200px) rotateX(${fx.rotateX}deg) rotateY(${fx.rotateY}deg)`
            : ''),
      }}
    >
      <div style={{ position: 'relative' }}>
        {content}
        {fx.glitch ? <GlitchLayers cfg={fx.glitch}>{content}</GlitchLayers> : null}
        {fx.shine ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-20%',
                background: `linear-gradient(105deg, transparent 42%, rgba(255,255,255,${fx.shine.strength}) 50%, transparent 58%)`,
                transform: `translateX(${(fx.shine.progress * 2 - 1) * 150}%)`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const MainComposition: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: project.backgroundColor }}>
      {/* tracks[0] is the top layer, so render in reverse order */}
      {[...project.tracks].reverse().map((track) =>
        track.clips.map((clip) => (
          <Sequence
            key={clip.id}
            from={clip.from}
            durationInFrames={Math.max(1, clip.durationInFrames)}
            layout="none"
          >
            <ClipRenderer clip={clip} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};
