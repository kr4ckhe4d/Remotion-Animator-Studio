// Renders PNG stills of presets for visual verification: node scripts/preset-stills.mjs
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
// presets.ts is bundled to plain ESM first (see the npx esbuild step in the runner)
import { buildPresetClips, PRESETS } from '/tmp/presets-bundle.mjs';

const SHOTS = [
  ['synthwaveOutrun', [70, 160]],
  ['nodeTrail', [150]],
  ['liquidType', [80]],
  ['isoCityGrowth', [130]],
  ['dayNight', [20, 130, 250]],
  ['commitTimeline', [220]],
];

mkdirSync('out/stills', { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('remotion/index.ts') });

const trailClip = {
  id: 'trail1',
  name: 'Trail',
  element: 'nodeTrail',
  from: 0,
  durationInFrames: 300,
  props: {
    data: '[{"x":0,"y":0,"label":"Start"},{"x":320,"y":-140,"label":"Research","color":"#35c4ff"},{"x":700,"y":60,"label":"Prototype"},{"x":1040,"y":-80,"label":"Launch","color":"#ffd166"},{"x":1380,"y":40,"label":"Scale"}]',
    color: '#6ee7a8',
    nodeColor: '#7c5cff',
    speed: 0.8,
    nodeSize: 16,
    lineWidth: 5,
    curved: 'yes',
    fontSize: 30,
    textColor: '#e8eaf0',
    opacity: 1,
    x: 280,
    y: 560,
  },
  effects: [],
};

for (const [presetId, frames] of SHOTS) {
  const clips =
    presetId === 'nodeTrail' ? [trailClip] : buildPresetClips(PRESETS[presetId], 1920, 1080, 0);
  const project = {
    name: presetId,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    backgroundColor: '#0b0c11',
    tracks: [{ id: 't1', name: 'demo', clips }],
  };
  const inputProps = { project };
  const composition = await selectComposition({ serveUrl, id: 'Main', inputProps });
  for (const frame of frames) {
    const output = `out/stills/${presetId}-${frame}.png`;
    await renderStill({ composition, serveUrl, frame, output, inputProps });
    console.log('wrote', output);
  }
}
