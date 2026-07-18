import React from 'react';
import { interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Clip } from '../types';

/** Deterministic pseudo-random in [0,1) from a seed + indices. */
const prand = (seed: string, a: number, b: number): number => {
  let h = 2166136261;
  const str = `${seed}|${a}|${b}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
};

/* ---------------- 1. Synthwave perspective grid ---------------- */

export const SynthGrid: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;
  const w = Number(p.width);
  const h = Number(p.height);
  const spacing = Number(p.spacing);
  const offset = ((frame / fps) * Number(p.speed) * spacing) % spacing;
  const line = String(p.lineColor);

  return (
    <div style={{ width: w, height: h, overflow: 'hidden', position: 'relative', opacity: p.opacity }}>
      <div
        style={{
          position: 'absolute',
          left: '-100%',
          top: 0,
          width: '300%',
          height: '500%',
          transformOrigin: '50% 0',
          transform: `perspective(300px) rotateX(60deg)`,
          backgroundImage: `repeating-linear-gradient(to bottom, ${line} 0 4px, transparent 4px ${spacing}px), repeating-linear-gradient(to right, ${line} 0 4px, transparent 4px ${spacing}px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: `0 ${offset}px`,
          boxShadow: `0 0 ${Number(p.glow)}px ${line}`,
        }}
      />
      {/* horizon haze */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(to bottom, ${p.horizonColor} 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};

/* ---------------- 1b. Neon striped sun ---------------- */

export const NeonSun: React.FC<{ clip: Clip }> = ({ clip }) => {
  const p = clip.props;
  const size = Number(p.size);
  const stripes = Math.max(0, Math.round(Number(p.stripes)));
  const id = clip.id;

  const bands: React.ReactNode[] = [];
  for (let i = 0; i < stripes; i++) {
    // stripes thicken and pack toward the bottom half, like the classic outrun sun
    const yPct = 50 + (i / stripes) * 50;
    const hPct = 1.2 + (i / stripes) * 3.4;
    bands.push(<rect key={i} x="0" y={`${yPct}%`} width="100%" height={`${hPct}%`} fill="#000" />);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block', filter: `drop-shadow(0 0 ${Number(p.glow)}px ${p.colorBottom})`, opacity: p.opacity }}
    >
      <defs>
        <linearGradient id={`sun-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={String(p.colorTop)} />
          <stop offset="100%" stopColor={String(p.colorBottom)} />
        </linearGradient>
        <mask id={`mask-${id}`}>
          <circle cx="50" cy="50" r="50" fill="#fff" />
          {bands}
        </mask>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#sun-${id})`} mask={`url(#mask-${id})`} />
    </svg>
  );
};

/* ---------------- 3. Generative isometric city ---------------- */

export const IsoCity: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;
  const n = Math.max(2, Math.min(9, Math.round(Number(p.gridSize))));
  const tile = Number(p.tileSize);
  const maxH = Number(p.buildingHeight);
  const stagger = Number(p.stagger);
  const seed = String(p.seed);
  const palette = String(p.colors)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const tw = tile; // iso tile half-width
  const th = tile / 2;
  const W = (n + n) * tw + tile;
  const H = (n + n) * th + maxH + tile;
  const cx = W / 2;
  const topY = maxH + th;

  const shade = (hex: string, f: number): string => {
    const v = parseInt(hex.replace('#', ''), 16);
    const r = Math.round(((v >> 16) & 255) * f);
    const g = Math.round(((v >> 8) & 255) * f);
    const b = Math.round((v & 255) * f);
    return `rgb(${r},${g},${b})`;
  };

  const buildings: React.ReactNode[] = [];
  // draw back-to-front so nearer buildings overlap correctly
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = cx + (c - r) * tw;
      const y = topY + (c + r) * th;
      const dist = Math.abs(c - (n - 1) / 2) + Math.abs(r - (n - 1) / 2);
      const delay = dist * stagger + prand(seed, r, c) * stagger;
      const grow = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 13, mass: 0.7 } });
      const bh = (0.3 + prand(seed, r, c + 99) * 0.7) * maxH * grow;
      const color = palette[Math.floor(prand(seed, r, c + 7) * palette.length)] ?? '#7c5cff';
      const yT = y - bh;
      buildings.push(
        <g key={`${r}-${c}`}>
          {/* left face */}
          <polygon
            points={`${x - tw},${yT + th} ${x},${yT + 2 * th} ${x},${y + 2 * th} ${x - tw},${y + th}`}
            fill={shade(color, 0.55)}
          />
          {/* right face */}
          <polygon
            points={`${x + tw},${yT + th} ${x},${yT + 2 * th} ${x},${y + 2 * th} ${x + tw},${y + th}`}
            fill={shade(color, 0.8)}
          />
          {/* top face */}
          <polygon
            points={`${x},${yT} ${x + tw},${yT + th} ${x},${yT + 2 * th} ${x - tw},${yT + th}`}
            fill={color}
          />
        </g>,
      );
    }
  }

  // blueprint street glow sweeping outward just ahead of the growth wave
  const sweep = (frame / stagger) * 1.2;
  const streets: React.ReactNode[] = [];
  for (let i = 0; i <= n; i++) {
    const glowOn = interpolate(sweep - i, [0, 1.5], [0, 0.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const x0 = cx + (0 - i) * tw;
    const y0 = topY + (0 + i) * th + 2 * th;
    const x1 = cx + (n - i) * tw;
    const y1 = topY + (n + i) * th + 2 * th;
    streets.push(
      <line key={`a${i}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={String(p.streetColor)} strokeWidth={2} opacity={glowOn} />,
      <line
        key={`b${i}`}
        x1={cx + (i - 0) * tw}
        y1={topY + (i + 0) * th + 2 * th}
        x2={cx + (i - n) * tw}
        y2={topY + (i + n) * th + 2 * th}
        stroke={String(p.streetColor)}
        strokeWidth={2}
        opacity={glowOn}
      />,
    );
  }

  return (
    <svg width={W} height={H} style={{ display: 'block', opacity: p.opacity }}>
      {streets}
      {buildings}
    </svg>
  );
};

/* ---------------- 4. Procedural day/night cycle ---------------- */

export const SkyCycle: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const p = clip.props;
  const w = Number(p.width);
  const h = Number(p.height);
  const seed = String(p.seed);
  const dur = Math.max(1, clip.durationInFrames);
  const t = (frame / dur) % 1; // one full day per clip

  // 0 = noon, .3 = sunset, .55 = midnight, .8 = sunrise, 1 = noon
  const stops = [0, 0.3, 0.55, 0.8, 1];
  const skyTop = interpolateColors(t, stops, ['#3d8fe0', '#c2373b', '#0d0b26', '#b3455f', '#3d8fe0']);
  const skyBottom = interpolateColors(t, stops, ['#a8d4f2', '#ffb45c', '#221a4a', '#ffc178', '#a8d4f2']);
  const nightness = interpolate(t, [0.35, 0.5, 0.85, 0.95], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // sun rises at t=.8, sets at t=.3 (wraps); simple arc parameterisation
  const sunPhase = ((t + 0.2) % 1) / 0.5; // 0..1 while sun is up
  const sunUp = sunPhase <= 1;
  const sunX = sunPhase * w;
  const sunY = h * 0.75 - Math.sin(sunPhase * Math.PI) * h * 0.55;
  const moonPhase = ((t - 0.3 + 1) % 1) / 0.5;
  const moonUp = moonPhase <= 1 && nightness > 0.1;

  const stars: React.ReactNode[] = [];
  const starCount = Math.round(Number(p.stars));
  for (let i = 0; i < starCount; i++) {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + i * 1.7));
    stars.push(
      <circle
        key={i}
        cx={prand(seed, i, 1) * w}
        cy={prand(seed, i, 2) * h * 0.6}
        r={0.6 + prand(seed, i, 3) * 1.6}
        fill="#fff"
        opacity={nightness * tw}
      />,
    );
  }

  const ridge = (layerSeed: number, base: number, amp: number): string => {
    let d = `M 0 ${h}`;
    const steps = 9;
    for (let i = 0; i <= steps; i++) {
      const x = (w / steps) * i;
      const y = h - base - prand(seed, layerSeed, i) * amp;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + ` L ${w} ${h} Z`;
  };
  const mFar = interpolateColors(t, stops, ['#5f86b5', '#7c3f55', '#141131', '#75405c', '#5f86b5']);
  const mNear = interpolateColors(t, stops, ['#39566e', '#4a2438', '#0b0920', '#452a3c', '#39566e']);

  return (
    <svg width={w} height={h} style={{ display: 'block', opacity: p.opacity }}>
      <defs>
        <linearGradient id={`sky-${clip.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBottom} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#sky-${clip.id})`} />
      {stars}
      {sunUp ? (
        <circle cx={sunX} cy={sunY} r={h * 0.08} fill="#ffd93d" style={{ filter: `drop-shadow(0 0 ${h * 0.05}px #ffb45c)` }} />
      ) : null}
      {moonUp ? (
        <circle
          cx={moonPhase * w}
          cy={h * 0.7 - Math.sin(moonPhase * Math.PI) * h * 0.5}
          r={h * 0.055}
          fill="#e8ecff"
          opacity={0.9}
          style={{ filter: `drop-shadow(0 0 ${h * 0.03}px #cfd8ff)` }}
        />
      ) : null}
      <path d={ridge(11, h * 0.18, h * 0.22)} fill={mFar} />
      <path d={ridge(23, h * 0.06, h * 0.16)} fill={mNear} />
    </svg>
  );
};

/* ---------------- 5. Git commit graph timeline ---------------- */

interface CommitDatum {
  m: string;
  b?: number;
  a?: number;
  d?: number;
}

export const CommitGraph: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = clip.props;
  const w = Number(p.width);
  const h = Number(p.height);
  let commits: CommitDatum[] = [];
  try {
    const parsed = JSON.parse(String(p.data));
    if (Array.isArray(parsed)) commits = parsed;
  } catch {
    /* bad JSON — draw nothing until it parses */
  }
  const laneColors = String(p.laneColors)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const gap = Number(p.nodeGap);
  const interval = fps / Number(p.speed); // frames between node reveals
  const progress = frame / interval;

  const laneY = (lane: number) => h / 2 + (lane - 0.5) * 110;
  const nodeX = (i: number) => 80 + i * gap;

  // camera: keep the reveal point around 60% width once it passes it
  const camShift = Math.max(0, nodeX(Math.min(progress, commits.length - 1)) - w * 0.6);

  const nodes: React.ReactNode[] = [];
  const links: React.ReactNode[] = [];
  commits.forEach((c, i) => {
    const lane = Number(c.b ?? 0);
    const color = laneColors[lane % laneColors.length] ?? '#6ee7a8';
    const reveal = spring({ frame: Math.max(0, frame - i * interval), fps, config: { damping: 11, mass: 0.6 } });
    const x = nodeX(i);
    const y = laneY(lane);
    if (i > 0) {
      const prev = commits[i - 1];
      const px = nodeX(i - 1);
      const py = laneY(Number(prev.b ?? 0));
      // link draws in just before its node pops
      const seg = interpolate(progress - (i - 1), [0, 1], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      links.push(
        <path
          key={`l${i}`}
          d={`M ${px} ${py} C ${px + gap / 2} ${py} ${x - gap / 2} ${y} ${x} ${y}`}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={gap * 1.4}
          strokeDashoffset={(1 - seg) * gap * 1.4}
          opacity={0.8}
        />,
      );
    }
    const adds = Math.round(Number(c.a ?? 0) * Math.min(1, reveal));
    const dels = Math.round(Number(c.d ?? 0) * Math.min(1, reveal));
    const typed = String(c.m).slice(0, Math.max(0, Math.floor((frame - i * interval) / 1.5)));
    nodes.push(
      <g key={`n${i}`} transform={`translate(${x}, ${y})`} opacity={Math.min(1, reveal * 1.4)}>
        <circle r={16 * reveal} fill="#0e0f13" stroke={color} strokeWidth={4} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
        <text
          y={lane === 0 ? -38 : 54}
          textAnchor="middle"
          fill="#e8eaf0"
          fontFamily="'Courier New', monospace"
          fontSize={26}
          fontWeight="bold"
        >
          {typed}
        </text>
        {(c.a ?? 0) + (c.d ?? 0) > 0 ? (
          <text y={lane === 0 ? -70 : 88} textAnchor="middle" fontFamily="'Courier New', monospace" fontSize={22}>
            <tspan fill="#6ee7a8">+{adds}</tspan>
            <tspan fill="#ff5c6c"> −{dels}</tspan>
          </text>
        ) : null}
      </g>,
    );
  });

  return (
    <svg width={w} height={h} style={{ display: 'block', opacity: p.opacity, overflow: 'hidden' }}>
      <g transform={`translate(${-camShift}, 0)`}>
        {links}
        {nodes}
      </g>
    </svg>
  );
};
