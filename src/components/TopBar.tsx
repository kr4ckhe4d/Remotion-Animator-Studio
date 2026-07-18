import React, { useRef, useState } from 'react';
import { playerRef, seekTo, togglePlay } from '../playerRef';
import { useStore } from '../store';
import type { Project } from '../types';
import { HelpModal } from './HelpModal';
import { RenderDialog } from './RenderDialog';

const SIZE_PRESETS: Record<string, [number, number]> = {
  'HD 1920×1080': [1920, 1080],
  '4K UHD 3840×2160': [3840, 2160],
  '4K DCI 4096×2160': [4096, 2160],
  'Vertical 1080×1920': [1080, 1920],
  'Vertical 4K 2160×3840': [2160, 3840],
  'Square 1080×1080': [1080, 1080],
  'Portrait 4:5 1080×1350': [1080, 1350],
  'Ultrawide 2560×1080': [2560, 1080],
};

const blankProject = (): Project => ({
  name: 'Untitled',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300,
  backgroundColor: '#0d0d14',
  tracks: [
    { id: `t-${Date.now()}-1`, name: 'Track 1', clips: [] },
    { id: `t-${Date.now()}-2`, name: 'Track 2', clips: [] },
  ],
});

export const TopBar: React.FC = () => {
  const project = useStore((s) => s.project);
  const playing = useStore((s) => s.playing);
  const muted = useStore((s) => s.muted);
  const canUndo = useStore((s) => s.history.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const { setProject, replaceProject, undo, redo } = useStore.getState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showExport, setShowExport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/[^a-z0-9-_ ]/gi, '') || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loadJson = (file: File) => {
    file.text().then((text) => {
      try {
        const p = JSON.parse(text) as Project;
        if (!p.tracks || !p.fps) throw new Error('bad file');
        replaceProject(p);
      } catch {
        alert('That file does not look like a saved project.');
      }
    });
  };

  const sizeKey =
    Object.keys(SIZE_PRESETS).find(
      (k) => SIZE_PRESETS[k][0] === project.width && SIZE_PRESETS[k][1] === project.height,
    ) ?? 'Custom';

  return (
    <header className="topbar">
      <div className="brand">
        🎬 <strong>Remotion Animator</strong>
      </div>

      <input
        className="project-name"
        value={project.name}
        onChange={(e) => setProject({ name: e.target.value })}
      />

      <div className="topbar-group">
        <button className="btn" onClick={() => seekTo(0)} title="Back to start">
          ⏮
        </button>
        <button className="btn btn-play" onClick={togglePlay}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          className="btn"
          title={muted ? 'Unmute preview' : 'Mute preview'}
          onClick={() => {
            const m = !muted;
            useStore.getState().setMuted(m);
            if (m) playerRef.current?.mute();
            else playerRef.current?.unmute();
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      <div className="topbar-group">
        <label className="dim">Size</label>
        <select
          value={sizeKey}
          onChange={(e) => {
            const preset = SIZE_PRESETS[e.target.value];
            if (preset) setProject({ width: preset[0], height: preset[1] });
          }}
        >
          {[...Object.keys(SIZE_PRESETS), 'Custom'].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <input
          type="number"
          min={16}
          max={7680}
          value={project.width}
          onChange={(e) => setProject({ width: Math.max(16, Number(e.target.value)) })}
          style={{ width: 62 }}
          title="Width"
        />
        <span className="dim">×</span>
        <input
          type="number"
          min={16}
          max={7680}
          value={project.height}
          onChange={(e) => setProject({ height: Math.max(16, Number(e.target.value)) })}
          style={{ width: 62 }}
          title="Height"
        />
        <label className="dim">Sec</label>
        <input
          type="number"
          min={1}
          max={3600}
          value={Math.round(project.durationInFrames / project.fps)}
          onChange={(e) =>
            setProject({ durationInFrames: Math.max(1, Number(e.target.value)) * project.fps })
          }
          style={{ width: 52 }}
        />
        <label className="dim">FPS</label>
        <select
          value={project.fps}
          onChange={(e) => {
            const fps = Number(e.target.value);
            const seconds = project.durationInFrames / project.fps;
            setProject({ fps, durationInFrames: Math.round(seconds * fps) });
          }}
        >
          {[24, 25, 30, 50, 60].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="topbar-group">
        <button className="btn" disabled={!canUndo} onClick={undo} title="Undo (⌘Z)">
          ↩
        </button>
        <button className="btn" disabled={!canRedo} onClick={redo} title="Redo (⇧⌘Z)">
          ↪
        </button>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-group">
        <button
          className="btn"
          title="New project"
          onClick={() => {
            if (window.confirm('Start a new project? (Current work stays in undo history)')) {
              replaceProject(blankProject());
            }
          }}
        >
          ✚ New
        </button>
        <button className="btn" onClick={saveJson}>
          💾 Save
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          📂 Open
        </button>
        <button className="btn" onClick={() => setShowHelp(true)} title="Help & docs">
          ？Help
        </button>
        <button className="btn btn-primary" onClick={() => setShowExport(true)}>
          ⬇ Export MP4
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadJson(f);
            e.target.value = '';
          }}
        />
      </div>

      {showExport ? <RenderDialog onClose={() => setShowExport(false)} /> : null}
      {showHelp ? <HelpModal onClose={() => setShowHelp(false)} /> : null}
    </header>
  );
};
