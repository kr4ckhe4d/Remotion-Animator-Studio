// Renders PNG stills of presets for visual verification: node scripts/preset-stills.mjs
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
// presets.ts is bundled to plain ESM first (see the npx esbuild step in the runner)
import { buildPresetClips, PRESETS } from '/tmp/presets-bundle.mjs';

const SHOTS = [
  ['synthwaveOutrun', [70]],
  ['liquidType', [80]],
  ['isoCityGrowth', [130]],
  ['dayNight', [20, 130, 250]],
  ['commitTimeline', [220]],
];

mkdirSync('out/stills', { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('remotion/index.ts') });

for (const [presetId, frames] of SHOTS) {
  const clips = buildPresetClips(PRESETS[presetId], 1920, 1080, 0);
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
