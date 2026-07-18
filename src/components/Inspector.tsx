import React, { useRef } from 'react';
import { EFFECTS, getEasing } from '../effects';
import { ELEMENTS } from '../elements';
import { findClip, useStore } from '../store';
import type { ParamDef } from '../types';

/** Small graph of the selected animation curve. */
const EasingPreview: React.FC<{ name: string }> = ({ name }) => {
  const W = 120;
  const H = 56;
  const pad = 6;
  const fn = getEasing(name);
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const v = fn(t);
    const x = pad + t * (W - pad * 2);
    // eased values can overshoot [0,1] (elastic, overshoot) — leave headroom
    const y = H - pad - v * (H - pad * 2) * 0.75 - (H - pad * 2) * 0.05;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={W} height={H} className="easing-preview">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} />
    </svg>
  );
};

/** Upload a local image/GIF and store it inline as a data URL. */
const FileUpload: React.FC<{ accept: string; onLoad: (dataUrl: string) => void }> = ({ accept, onLoad }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button className="btn btn-small" onClick={() => ref.current?.click()}>
        📁 Upload file…
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (f.size > 8 * 1024 * 1024) {
            alert('Please keep uploads under 8 MB — larger files make the project slow to save. Host bigger files and paste the URL instead.');
            return;
          }
          const reader = new FileReader();
          reader.onload = () => onLoad(String(reader.result));
          reader.readAsDataURL(f);
        }}
      />
    </>
  );
};

const ParamControl: React.FC<{
  def: ParamDef;
  value: any;
  onChange: (v: any) => void;
  onCommit: () => void;
}> = ({ def, value, onChange, onCommit }) => {
  switch (def.kind) {
    case 'number':
      return (
        <div className="param-row">
          <label>{def.label}</label>
          <div className="param-number">
            <input
              type="range"
              min={def.min}
              max={def.max}
              step={def.step}
              value={Number(value)}
              onPointerDown={onCommit}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            <input
              type="number"
              min={def.min}
              max={def.max}
              step={def.step}
              value={Number(value)}
              onFocus={onCommit}
              onChange={(e) => onChange(Number(e.target.value))}
            />
          </div>
        </div>
      );
    case 'color':
      return (
        <div className="param-row">
          <label>{def.label}</label>
          <div className="param-color">
            <input
              type="color"
              value={String(value)}
              onFocus={onCommit}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              type="text"
              value={String(value)}
              onFocus={onCommit}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      );
    case 'select':
      return (
        <div className="param-row">
          <label>{def.label}</label>
          <select
            value={String(value)}
            onChange={(e) => {
              onCommit();
              onChange(e.target.value);
            }}
          >
            {def.options?.map((o) => (
              <option key={o} value={o}>
                {o.includes(',') ? o.split(',')[0].replace(/"/g, '') : o}
              </option>
            ))}
          </select>
        </div>
      );
    case 'text':
      return (
        <div className="param-row">
          <label>{def.label}</label>
          <input
            type="text"
            value={String(value)}
            onFocus={onCommit}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
};

export const Inspector: React.FC = () => {
  const project = useStore((s) => s.project);
  const selectedClipIds = useStore((s) => s.selectedClipIds);
  const { updateClipProps, updateClip, updateEffectParams, removeEffect, removeClips, commit, duplicateSelection } =
    useStore.getState();

  if (selectedClipIds.length > 1) {
    const clips = selectedClipIds.map((id) => findClip(project, id)).filter(Boolean);
    const grouped = clips.length > 0 && clips.every((c) => c!.groupId && c!.groupId === clips[0]!.groupId);
    return (
      <aside className="inspector">
        <div className="panel-title">{selectedClipIds.length} clips selected</div>
        <div className="inspector-empty">
          {clips.map((c) => (
            <div key={c!.id}>
              {c!.groupId ? '⛓ ' : ''}
              {ELEMENTS[c!.element].icon} {c!.name}
            </div>
          ))}
        </div>
        {grouped ? (
          <button
            className="btn"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => useStore.getState().ungroupSelection()}
          >
            ⛓️‍💥 Ungroup (⇧⌘G)
          </button>
        ) : (
          <button
            className="btn"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => useStore.getState().groupSelection()}
          >
            ⛓ Group — select & move as one (⌘G)
          </button>
        )}
        <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={duplicateSelection}>
          ⧉ Duplicate all (⌘D)
        </button>
        <button className="btn btn-danger" style={{ marginTop: 8 }} onClick={() => removeClips(selectedClipIds)}>
          Delete {selectedClipIds.length} clips
        </button>
        <div className="inspector-empty" style={{ marginTop: 12 }}>
          Drag any selected clip in the timeline to move the whole group. ⌘C / ⌘V copies and pastes them at
          the playhead.
        </div>
      </aside>
    );
  }

  const clip = findClip(project, selectedClipIds[0]);

  if (!clip) {
    return (
      <aside className="inspector">
        <div className="panel-title">Inspector</div>
        <div className="inspector-empty">
          Select a clip in the timeline to edit its parameters.
          <br />
          <br />
          Drag elements from the left panel onto a track to get started.
        </div>
      </aside>
    );
  }

  const elDef = ELEMENTS[clip.element];

  return (
    <aside className="inspector">
      <div className="panel-title">
        {elDef.icon} {clip.name}
      </div>

      <div className="param-row">
        <label>Name</label>
        <input
          type="text"
          value={clip.name}
          onFocus={commit}
          onChange={(e) => updateClip(clip.id, { name: e.target.value })}
        />
      </div>
      <div className="param-row">
        <label>Start (frame)</label>
        <input
          type="number"
          min={0}
          max={project.durationInFrames - 1}
          value={clip.from}
          onFocus={commit}
          onChange={(e) =>
            updateClip(clip.id, {
              from: Math.max(0, Math.min(project.durationInFrames - 1, Number(e.target.value))),
            })
          }
        />
      </div>
      <div className="param-row">
        <label>Length (frames)</label>
        <input
          type="number"
          min={2}
          value={clip.durationInFrames}
          onFocus={commit}
          onChange={(e) => updateClip(clip.id, { durationInFrames: Math.max(2, Number(e.target.value)) })}
        />
      </div>

      <div className="section-title">Properties</div>
      {elDef.params.map((def) => (
        <React.Fragment key={def.key}>
          <ParamControl
            def={def}
            value={clip.props[def.key]}
            onCommit={commit}
            onChange={(v) => updateClipProps(clip.id, { [def.key]: v })}
          />
          {def.key === 'src' && ['image', 'gif'].includes(clip.element) ? (
            <FileUpload
              accept={clip.element === 'gif' ? 'image/gif' : 'image/*'}
              onLoad={(dataUrl) => {
                commit();
                updateClipProps(clip.id, { src: dataUrl });
              }}
            />
          ) : null}
        </React.Fragment>
      ))}

      <div className="section-title">
        Effects <span className="dim">({clip.effects.length})</span>
      </div>
      {clip.effects.length === 0 ? (
        <div className="inspector-empty">Drag an effect from the library onto this clip.</div>
      ) : (
        clip.effects.map((fx) => {
          const fxDef = EFFECTS[fx.type];
          return (
            <div key={fx.id} className="effect-card">
              <div className="effect-card-head">
                <span>
                  {fxDef.icon} {fxDef.label}
                </span>
                <button className="track-delete" title="Remove effect" onClick={() => removeEffect(clip.id, fx.id)}>
                  ×
                </button>
              </div>
              {fxDef.params.map((def) => (
                <React.Fragment key={def.key}>
                  <ParamControl
                    def={def}
                    value={fx.params[def.key] ?? fxDef.defaults[def.key]}
                    onCommit={commit}
                    onChange={(v) => updateEffectParams(clip.id, fx.id, { [def.key]: v })}
                  />
                  {def.key === 'easing' ? (
                    <EasingPreview name={String(fx.params.easing ?? fxDef.defaults.easing ?? 'easeOut')} />
                  ) : null}
                </React.Fragment>
              ))}
              {fx.type === 'motionPath' ? (
                <button
                  className="btn btn-small"
                  onClick={() => useStore.getState().startDrawingPath(clip.id, fx.id)}
                >
                  ✏️ Draw path on canvas
                </button>
              ) : null}
            </div>
          );
        })
      )}

      <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={duplicateSelection}>
        ⧉ Duplicate (⌘D)
      </button>
      <button className="btn btn-danger" style={{ marginTop: 8 }} onClick={() => removeClips([clip.id])}>
        Delete clip
      </button>
    </aside>
  );
};
