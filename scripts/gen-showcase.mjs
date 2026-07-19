// Builds examples/showcase.json — a 60s 4K tour of every editor capability.
// Run:  npx esbuild src/presets.ts --bundle --format=esm --outfile=/tmp/presets-bundle.mjs
//       node scripts/gen-showcase.mjs
import { writeFileSync } from 'node:fs';
import { buildPresetClips, PRESETS } from '/tmp/presets-bundle.mjs';

const W = 3840;
const H = 2160;
const FPS = 30;
const DUR = 1800; // 60s

let n = 0;
const id = (p) => `${p}${n++}`;
const clip = (element, name, from, dur, props, effects = []) => ({
  id: id('c'),
  name,
  element,
  from,
  durationInFrames: dur,
  props,
  effects: effects.map(([type, params]) => ({ id: id('e'), type, params })),
});

const FONT = 'Helvetica, Arial, sans-serif';

/** Lower-third scene label: accent bar + text, slides in, fades out with the scene. */
const label = (text, from, dur) => [
  clip('shape', `${text} bar`, from + 10, dur - 20, {
    kind: 'rect',
    width: 18,
    height: 110,
    fill: '#7c5cff',
    borderRadius: 9,
    rotation: 0,
    opacity: 1,
    x: W * 0.055,
    y: H * 0.915,
  }, [
    ['wipeIn', { direction: 'top', duration: 12, easing: 'easeOut' }],
    ['fadeOut', { duration: 14 }],
  ]),
  clip('text', `${text} label`, from + 14, dur - 24, {
    text,
    fontSize: 64,
    color: '#ffffff',
    fontFamily: FONT,
    fontWeight: 700,
    letterSpacing: 2,
    x: W * 0.055 + 40,
    y: H * 0.915,
  }, [
    ['slideIn', { direction: 'left', distance: 160, duration: 16, easing: 'easeOut' }],
    ['fadeIn', { duration: 10 }],
    ['fadeOut', { duration: 14 }],
  ]),
];

// anchor label text at left edge instead of center
const leftAlignLabel = (clips) => {
  for (const c of clips) {
    if (c.element === 'text') c.props.x += String(c.props.text).length * c.props.fontSize * 0.28;
  }
  return clips;
};

/** Insert a preset's clips into a scene window, clamping to the window's end. */
const preset = (presetId, from, sceneDur, tweak = null) => {
  const end = from + sceneDur;
  const clips = buildPresetClips(PRESETS[presetId], W, H, from)
    .filter((c) => c.from < end - 4)
    .map((c) => ({ ...c, durationInFrames: Math.max(2, Math.min(c.durationInFrames, end - c.from)) }));
  if (tweak) clips.forEach(tweak);
  return clips;
};

const scenes = [];

/* ---- S1 · 0-180: Intro title ---- */
scenes.push([
  clip('background', 'Intro BG', 0, 180, { fillType: 'linear', colorA: '#131024', colorB: '#3b1f6e', angle: 135 }, []),
  clip('particles', 'Intro Confetti', 0, 180, {
    kind: 'confetti', count: 140, width: W, height: H, size: 26, speed: 1.2, drift: 60,
    colors: '#7c5cff,#35c4ff,#ff5c6c,#ffd166,#6ee7a8', imageSrc: '', seed: 'intro', opacity: 1, x: W / 2, y: H / 2,
  }, [['fadeIn', { duration: 12 }], ['fadeOut', { duration: 20 }]]),
  clip('text', 'Intro Title', 8, 172, {
    text: 'REMOTION ANIMATOR', fontSize: 230, color: '#ffffff', fontFamily: FONT, fontWeight: 900,
    letterSpacing: 10, x: W / 2, y: H * 0.44,
  }, [
    ['letterPop', { stagger: 1.2, duration: 14, distance: 110 }],
    ['glow', { color: '#7c5cff', radius: 45, pulseSpeed: 0.5 }],
    ['shine', { period: 2.5, strength: 0.4 }],
    ['fadeOut', { duration: 16 }],
  ]),
  clip('text', 'Intro Sub', 45, 135, {
    text: 'the drag-and-drop motion studio — built on Remotion', fontSize: 76, color: '#b9a8ff',
    fontFamily: FONT, fontWeight: 400, letterSpacing: 4, x: W / 2, y: H * 0.58,
  }, [['typewriter', { charsPerSecond: 30 }], ['fadeOut', { duration: 16 }]]),
]);

/* ---- S2 · 180-420: Synthwave Outrun (car, skyline, sun, grid) ---- */
scenes.push([...preset('synthwaveOutrun', 180, 240), ...leftAlignLabel(label('Generative scenes — Synthwave Outrun', 180, 240))]);

/* ---- S3 · 420-600: Iso city growth ---- */
scenes.push([...preset('isoCityGrowth', 420, 180), ...leftAlignLabel(label('Procedural isometric city', 420, 180))]);

/* ---- S4 · 600-900: Day/Night cycle ---- */
scenes.push([...preset('dayNight', 600, 300), ...leftAlignLabel(label('Procedural day / night cycle', 600, 300))]);

/* ---- S5 · 900-1080: Liquid type ---- */
scenes.push([...preset('liquidType', 900, 180), ...leftAlignLabel(label('Kinetic & audio-reactive typography', 900, 180))]);

/* ---- S6 · 1080-1230: HTML mockup + cursor ---- */
const chatHtml = `
<div style="width:100%;height:100%;background:#15171f;border:2px solid #2c3040;border-radius:40px;padding:60px;font-family:${FONT};display:flex;flex-direction:column;gap:34px;box-shadow:0 40px 120px rgba(0,0,0,.6)">
  <div style="color:#8b90a0;font-size:36px;letter-spacing:4px;font-weight:700">ANY HTML AS A CLIP</div>
  <div style="align-self:flex-end;background:#7c5cff;color:#fff;padding:26px 40px;border-radius:32px 32px 8px 32px;font-size:44px">build UI mockups…</div>
  <div style="align-self:flex-start;background:#232734;color:#e8eaf0;padding:26px 40px;border-radius:32px 32px 32px 8px;font-size:44px">…and animate them like clips ✨</div>
  <div style="margin-top:auto;background:linear-gradient(180deg,#8b6bff,#6a48f0);color:#fff;align-self:center;padding:30px 90px;border-radius:26px;font-size:52px;font-weight:700;box-shadow:0 20px 60px rgba(124,92,255,.5)">Click me</div>
</div>`;
scenes.push([
  clip('background', 'HTML BG', 1080, 150, { fillType: 'solid', colorA: '#0e0f13', colorB: '#0e0f13', angle: 0 }, []),
  clip('html', 'Chat Mockup', 1080, 150, {
    html: chatHtml, width: Math.round(W * 0.42), height: Math.round(H * 0.62), contentScale: 1.6,
    opacity: 1, x: W / 2, y: H * 0.46,
  }, [
    ['slideIn', { direction: 'bottom', distance: 400, duration: 20, easing: 'overshoot' }],
    ['clickPulse', { at: 95, depth: 0.05, duration: 10 }],
    ['fadeOut', { duration: 14 }],
  ]),
  clip('cursor', 'Demo Cursor', 1095, 130, { size: 110, color: '#ffffff', x: W * 0.78, y: H * 0.9 }, [
    ['motionPath', { path: `M 0 0 C -400 -200 -700 -500 -880 -640`, orient: 'no', easing: 'easeInOut' }],
    ['clickPulse', { at: 78, depth: 0.3, duration: 10 }],
    ['fadeIn', { duration: 10 }],
    ['fadeOut', { duration: 12 }],
  ]),
  ...leftAlignLabel(label('HyperFrames-style HTML mockups & cursor demos', 1080, 150)),
]);

/* ---- S7 · 1230-1320: Glitch stinger ---- */
scenes.push([
  clip('background', 'Glitch BG', 1230, 90, { fillType: 'solid', colorA: '#0b0114', colorB: '#0b0114', angle: 0 }, []),
  ...preset('glitchTitle', 1230, 90),
  ...leftAlignLabel(label('32 stackable effects', 1230, 90)),
]);

/* ---- S8 · 1320-1500: Story trail ---- */
scenes.push([
  clip('background', 'Trail BG', 1320, 180, { fillType: 'radial', colorA: '#12172b', colorB: '#07090f', angle: 0 }, []),
  clip('nodeTrail', 'Journey', 1330, 170, {
    points: '0,0; 640,-280; 1400,120; 2080,-160; 2760,80',
    labels: 'Idea, Research, Prototype, Launch, Scale',
    color: '#6ee7a8', nodeColor: '#7c5cff', speed: 1, nodeSize: 34, lineWidth: 11, curved: 'yes',
    fontSize: 62, textColor: '#e8eaf0', opacity: 1, x: W * 0.14, y: H * 0.52,
  }, [['fadeIn', { duration: 10 }], ['fadeOut', { duration: 14 }]]),
  ...leftAlignLabel(label('Story trails — draw waypoints on the canvas', 1320, 180)),
]);

/* ---- S9 · 1500-1650: Commit graph ---- */
scenes.push([
  ...preset('commitTimeline', 1500, 150, (c) => {
    if (c.element === 'commitGraph') {
      c.props.speed = 1.3;
      c.props.width = Math.round(W * 0.45);
      c.props.height = Math.round(H * 0.25);
      // hardcoded node/text sizes are tuned for 1080p — scale the whole graph 2× for 4K
      c.effects.push({
        id: id('e'),
        type: 'transform',
        params: { start: 0, duration: 1, fromX: 0, toX: 0, fromY: 0, toY: 0, fromScale: 2, toScale: 2, fromRotate: 0, toRotate: 0, fromOpacity: 1, toOpacity: 1, easing: 'linear' },
      });
    }
    if (c.element === 'text') c.props.fontSize = Math.round(H * 0.045);
  }),
  ...leftAlignLabel(label('Data-driven animation — git history', 1500, 150)),
]);

/* ---- S10 · 1650-1800: End card ---- */
scenes.push([
  clip('background', 'End BG', 1650, 150, { fillType: 'linear', colorA: '#1c0533', colorB: '#0b0114', angle: 180 }, []),
  clip('particles', 'End Confetti', 1650, 150, {
    kind: 'confetti', count: 160, width: W, height: H, size: 26, speed: 1.4, drift: 60,
    colors: '#7c5cff,#35c4ff,#ff5c6c,#ffd166,#6ee7a8', imageSrc: '', seed: 'finale', opacity: 1, x: W / 2, y: H / 2,
  }, [['fadeIn', { duration: 10 }]]),
  clip('text', 'End Title', 1660, 140, {
    text: 'MAKE SOMETHING MOVING', fontSize: 190, color: '#ffffff', fontFamily: FONT, fontWeight: 900,
    letterSpacing: 8, textureSrc: 'linear-gradient(115deg, #ffd166, #ff3ea5 45%, #7c5cff)', x: W / 2, y: H * 0.44,
  }, [
    ['letterPop', { stagger: 1, duration: 14, distance: 90 }],
    ['shine', { period: 2.4, strength: 0.5 }],
    ['glow', { color: '#7c5cff', radius: 40, pulseSpeed: 0 }],
  ]),
  clip('text', 'End URL', 1695, 105, {
    text: 'github.com/kr4ckhe4d/Remotion-Animator-Studio', fontSize: 70, color: '#b9a8ff',
    fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: 2, x: W / 2, y: H * 0.6,
  }, [['typewriter', { charsPerSecond: 30 }]]),
]);

/* ---- assemble: distribute each scene's clips over shared layer tracks ---- */
const TRACKS = 9;
const lanes = Array.from({ length: TRACKS }, (_, i) => ({
  id: `lane-${i}`,
  name: i === 0 ? 'Top' : i === TRACKS - 1 ? 'Backgrounds' : `Layer ${TRACKS - i}`,
  clips: [],
}));
for (const scene of scenes) {
  // scene arrays are ordered bottom→top; backgrounds sink to the last lane, tops rise
  scene.forEach((c, i) => {
    lanes[Math.max(0, TRACKS - 1 - i)].clips.push(c);
  });
}

const project = {
  name: 'Showcase 4K',
  width: W,
  height: H,
  fps: FPS,
  durationInFrames: DUR,
  backgroundColor: '#0b0c11',
  tracks: lanes,
};

writeFileSync('examples/showcase.json', JSON.stringify(project, null, 2));
console.log(`Wrote examples/showcase.json — ${DUR / FPS}s @ ${W}x${H}, ${scenes.flat().length} clips`);
