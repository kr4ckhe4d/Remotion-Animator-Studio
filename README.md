# Remotion Animator

A web-based, drag-and-drop animation maker built on [Remotion](https://remotion.dev). Compose animations visually — timeline, tracks, presets, effects, live preview — then render real MP4s (up to 4K60) with Remotion's renderer.

**Full documentation: [DOCS.md](DOCS.md)**

## Quick start

```bash
npm install
npm run dev        # editor at http://localhost:5173 + local render server
```

## Highlights

- **Elements**: text, counters, SVG shapes, images, video, audio, GIFs, emoji, gradient backgrounds
- **25+ drag-on effects** including the fiddly-in-DaVinci ones: glitch, RGB split, camera shake, ken burns, light sweep, glow, wipes, letter-pop, typewriter
- **Preset library**: lower thirds, title intros, glitch titles, news tickers, stat counters, end cards…
- **One-click MP4 export** from the UI with progress — any aspect ratio, up to 4K60
- **Autosave** + JSON save/open, undo/redo, keyboard shortcuts

## Using the editor

- **Elements** (left panel): drag Text / Shape / Image / Emoji / Background onto a timeline track, or double-click to add at the playhead.
- **Effects** (left panel): drag onto a clip in the timeline, or double-click to apply to the selected clip. Includes fade, slide, zoom, spring pop, spin, rotate, pulse, wiggle, blur, and typewriter.
- **Timeline** (bottom): drag clips to move them, drag their edges to trim, click/drag the ruler to scrub. Shift-click a lane to move the selected clip to that track. Zoom slider on the right.
- **Inspector** (right panel): every parameter of the selected clip and its effects — sliders, color pickers, dropdowns.
- **Canvas**: with a clip selected, drag anywhere on the preview to reposition it.
- **Shortcuts**: `Space` play/pause · `Delete` remove selected clip · `⌘Z` / `⇧⌘Z` undo/redo.
- **Save / Open**: projects serialize to JSON.

## Rendering an MP4

Rendering uses Remotion's server-side renderer (Chrome + FFmpeg, handled automatically):

1. In the editor, click **Save** to download `project.json` and place it in this folder.
2. Run:

   ```bash
   npm run render                                # renders ./project.json → out/animation.mp4
   npm run render -- my-project.json out/my.mp4  # custom paths
   ```

## Architecture

| Path | Purpose |
| --- | --- |
| `src/types.ts` | Project/track/clip/effect data model |
| `src/effects.ts` | Effect registry + the math that turns effects into styles |
| `src/elements.ts` | Element registry (defaults + inspector schema) |
| `src/store.ts` | Zustand store: tracks, clips, selection, undo/redo |
| `src/remotion/MainComposition.tsx` | The actual Remotion composition (shared by preview + render) |
| `src/components/` | Editor UI: TopBar, Library, PreviewPanel, Timeline, Inspector |
| `remotion/` | Entry point for the server-side renderer |
| `render.mjs` | `npm run render` script (`@remotion/bundler` + `@remotion/renderer`) |

The same `MainComposition` powers the in-browser `<Player>` preview and the MP4 render, so what you see is exactly what you get.

### Adding a new effect

1. Add its name to `EffectType` in `src/types.ts`.
2. Register label/params/defaults in `EFFECTS` in `src/effects.ts`.
3. Implement its math in `computeEffectStyle` (same file).

It automatically appears in the library and inspector — the UI is schema-driven.

### Adding a new element

Same idea: extend `ElementType`, register it in `src/elements.ts`, and render it in `ElementContent` in `src/remotion/MainComposition.tsx`.
