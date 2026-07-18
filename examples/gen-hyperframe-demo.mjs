// Generates examples/hyperframe-style-launch.json — a HyperFrames-style launch video
// (modeled on heygen-com/hyperframes-launches/timeline-launch) built entirely from
// this editor's elements: HTML mockups, cursor storytelling, kinetic + texture text.
// Usage: node examples/gen-hyperframe-demo.mjs
import { writeFileSync } from 'node:fs';

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

// ---------- Act 1 (0–5s): the desync gag ----------
const buttonApp = `
<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#191b26,#12131c);border:1px solid #2c3040;border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.55)">
  <div style="display:flex;flex-direction:column;align-items:center;gap:26px">
    <div style="font-family:${FONT};font-weight:700;color:#8b90a0;font-size:22px;letter-spacing:3px">SOUND BOARD v0.1</div>
    <div style="width:230px;height:230px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff7b6b,#e62b2b);display:flex;align-items:center;justify-content:center;font-size:88px;box-shadow:0 18px 40px rgba(230,43,43,.45), inset 0 -10px 24px rgba(0,0,0,.35)">📯</div>
    <div style="font-family:${FONT};color:#e8eaf0;font-size:26px;font-weight:500">press for honk</div>
  </div>
</div>`;

// ---------- Act 2 (5–10s): the chat spiral ----------
const chatApp = `
<div style="width:100%;height:100%;background:#15171f;border:1px solid #2c3040;border-radius:24px;padding:34px;font-family:${FONT};display:flex;flex-direction:column;gap:18px;box-shadow:0 30px 80px rgba(0,0,0,.55)">
  <div style="color:#8b90a0;font-size:19px;letter-spacing:2px;font-weight:700">ASSISTANT CHAT</div>
  <div style="align-self:flex-end;background:#7c5cff;color:#fff;padding:14px 22px;border-radius:18px 18px 4px 18px;font-size:24px;max-width:75%">the honk plays ~250ms late — fix the timing?</div>
  <div style="align-self:flex-start;background:#232734;color:#e8eaf0;padding:14px 22px;border-radius:18px 18px 18px 4px;font-size:24px">Done! Sound is now perfectly synced. ✅</div>
  <div style="align-self:flex-end;background:#7c5cff;color:#fff;padding:14px 22px;border-radius:18px 18px 4px 18px;font-size:24px;max-width:75%">…it is not. still late.</div>
  <div style="align-self:flex-start;background:#232734;color:#e8eaf0;padding:14px 22px;border-radius:18px 18px 18px 4px;font-size:24px">Done! Really fixed it this time. ✅✅</div>
  <div style="align-self:flex-end;background:#7c5cff;color:#fff;padding:14px 22px;border-radius:18px 18px 4px 18px;font-size:24px">IT&nbsp;IS&nbsp;WORSE</div>
</div>`;

// ---------- Act 3 (10–15s): the timeline editor fixes it ----------
const timelineApp = `
<div style="width:100%;height:100%;background:#101218;border:1px solid #2c3040;border-radius:24px;padding:30px;font-family:${FONT};box-shadow:0 30px 80px rgba(0,0,0,.55)">
  <div style="color:#8b90a0;font-size:19px;letter-spacing:2px;font-weight:700;margin-bottom:22px">TIMELINE EDITOR</div>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
    <div style="width:90px;color:#8b90a0;font-size:17px">Video</div>
    <div style="flex:1;height:56px;background:#232a3d;border:1px solid #35415e;border-radius:10px;display:flex;align-items:center;padding-left:16px;color:#9db1e0;font-size:18px">📯 honk-button.mp4</div>
  </div>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
    <div style="width:90px;color:#8b90a0;font-size:17px">SFX</div>
    <div style="flex:1;height:56px;border:1px dashed #3a3350;border-radius:10px;position:relative">
      <div style="position:absolute;left:26%;top:0;width:34%;height:100%;background:linear-gradient(180deg,#3f8f5f,#2f6b48);border:1px solid #57b57e;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#d9ffe9;font-size:18px">🔊 honk.wav</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:14px">
    <div style="width:90px;color:#8b90a0;font-size:17px">Music</div>
    <div style="flex:1;height:56px;background:#3d3564;border:1px solid #55497e;border-radius:10px"></div>
  </div>
</div>`;

const W = 1920;
const H = 1080;
const project = {
  name: 'Hyperframe-style launch',
  width: W,
  height: H,
  fps: 30,
  durationInFrames: 600,
  backgroundColor: '#0b0c11',
  tracks: [
    {
      id: id('t'),
      name: 'Cursor & FX',
      clips: [
        // Act 1: cursor flies in along an arc, arrives ~f95, clicks at ~f100
        clip('cursor', 'Cursor', 20, 90, { size: 64, color: '#ffffff', x: 1250, y: 900 }, [
          ['motionPath', { path: 'M 0 0 C -120 -120 -420 -300 -540 -350', orient: 'no', easing: 'easeInOut' }],
          ['clickPulse', { at: 82, depth: 0.3, duration: 10 }],
          ['fadeIn', { duration: 10 }],
        ]),
        // the late *HONK*
        clip(
          'text',
          'HONK late',
          115,
          35,
          { text: '*HONK*', fontSize: 130, color: '#ffd166', fontFamily: FONT, fontWeight: 900, letterSpacing: 4, x: 1380, y: 330 },
          [
            ['springPop', { damping: 9, mass: 0.7 }],
            ['rgbSplit', { amount: 4, jitter: 2 }],
            ['fadeOut', { duration: 10 }],
          ],
        ),
        clip(
          'text',
          'late label',
          124,
          26,
          { text: '…250 ms late 😬', fontSize: 44, color: '#8b90a0', fontFamily: FONT, fontWeight: 500, x: 1380, y: 470 },
          [['fadeIn', { duration: 8 }], ['fadeOut', { duration: 8 }]],
        ),
        // Act 3: the SFX "clip" that drags into place, then snaps with a glow
        clip(
          'shape',
          'Drag ghost',
          360,
          75,
          { kind: 'rect', width: 300, height: 56, fill: '#2f6b48', borderRadius: 10, opacity: 0.9, x: 682, y: 415 },
          [
            ['transform', { start: 5, duration: 40, fromX: 0, toX: 258, fromY: 0, toY: 0, fromScale: 1, toScale: 1, fromRotate: 0, toRotate: 0, fromOpacity: 1, toOpacity: 1, easing: 'overshoot' }],
            ['glow', { color: '#6ee7a8', radius: 18, pulseSpeed: 0 }],
            ['fadeIn', { duration: 6 }],
            ['fadeOut', { duration: 8 }],
          ],
        ),
        clip(
          'text',
          'snap!',
          428,
          52,
          { text: 'drag. snap. synced. ✅', fontSize: 54, color: '#6ee7a8', fontFamily: FONT, fontWeight: 700, x: 960, y: 890 },
          [['letterPop', { stagger: 1, duration: 12, distance: 30 }], ['fadeOut', { duration: 10 }]],
        ),
      ],
    },
    {
      id: id('t'),
      name: 'Scenes',
      clips: [
        clip('html', 'Button app', 0, 150, { html: buttonApp, width: 820, height: 700, contentScale: 1, opacity: 1, x: 700, y: 540 }, [
          ['slideIn', { direction: 'bottom', distance: 260, duration: 22, easing: 'easeOut' }],
          ['fadeIn', { duration: 14 }],
          ['clickPulse', { at: 100, depth: 0.06, duration: 10 }],
          ['slideOut', { direction: 'left', distance: 900, duration: 16, easing: 'easeIn' }],
        ]),
        clip('html', 'Chat spiral', 150, 150, { html: chatApp, width: 900, height: 760, contentScale: 1, opacity: 1, x: 960, y: 540 }, [
          ['slideIn', { direction: 'right', distance: 700, duration: 18, easing: 'easeOut' }],
          ['wipeIn', { direction: 'top', duration: 40, easing: 'easeOut' }],
          ['shake', { intensity: 4, speed: 3, rotation: 0.4 }],
          ['zoomOut', { toScale: 0.92, duration: 18, easing: 'easeIn' }],
          ['fadeOut', { duration: 14 }],
        ]),
        clip('html', 'Timeline editor', 300, 180, { html: timelineApp, width: 1180, height: 460, contentScale: 1, opacity: 1, x: 960, y: 470 }, [
          ['zoomIn', { fromScale: 0.85, duration: 20, easing: 'overshoot' }],
          ['fadeIn', { duration: 12 }],
          ['fadeOut', { duration: 14 }],
        ]),
      ],
    },
    {
      id: id('t'),
      name: 'End card',
      clips: [
        clip(
          'text',
          'Title',
          480,
          120,
          {
            text: 'TIMELINE EDITOR',
            fontSize: 150,
            color: '#ffffff',
            fontFamily: FONT,
            fontWeight: 900,
            letterSpacing: 6,
            textureSrc: 'https://picsum.photos/seed/aurora/1200/400',
            x: 960,
            y: 460,
          },
          [
            ['letterPop', { stagger: 1.2, duration: 14, distance: 60 }],
            ['shine', { period: 2.2, strength: 0.45 }],
            ['glow', { color: '#7c5cff', radius: 22, pulseSpeed: 0 }],
          ],
        ),
        clip(
          'text',
          'Sub',
          505,
          95,
          { text: 'now in Remotion Animator', fontSize: 52, color: '#b9a8ff', fontFamily: FONT, fontWeight: 400, letterSpacing: 3, x: 960, y: 620 },
          [['typewriter', { charsPerSecond: 24 }]],
        ),
        clip(
          'particles',
          'Confetti',
          480,
          120,
          { kind: 'confetti', count: 120, width: W, height: H, size: 14, speed: 1.4, drift: 30, colors: '#7c5cff,#35c4ff,#ff5c6c,#ffd166,#6ee7a8', seed: 'launch', opacity: 1, x: 960, y: 540 },
          [['fadeIn', { duration: 10 }]],
        ),
      ],
    },
    {
      id: id('t'),
      name: 'Background',
      clips: [
        clip('background', 'BG', 0, 600, { fillType: 'radial', colorA: '#181a28', colorB: '#0b0c11', angle: 135 }, []),
        clip(
          'particles',
          'Ambient dust',
          0,
          600,
          { kind: 'embers', count: 40, width: W, height: H, size: 8, speed: 0.5, drift: 40, colors: '#4a4668', seed: 'dust', opacity: 0.5, x: 960, y: 540 },
          [],
        ),
      ],
    },
  ],
};

writeFileSync('examples/hyperframe-style-launch.json', JSON.stringify(project, null, 2));
console.log(`Wrote examples/hyperframe-style-launch.json (${project.durationInFrames / project.fps}s, ${project.tracks.length} tracks)`);
