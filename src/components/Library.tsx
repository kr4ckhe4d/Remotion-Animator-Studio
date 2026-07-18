import React, { useState } from 'react';
import { EFFECTS } from '../effects';
import { ELEMENTS } from '../elements';
import { PRESETS } from '../presets';
import { useStore } from '../store';
import type { EffectType, ElementType } from '../types';

export const ELEMENT_MIME = 'application/x-animator-element';
export const EFFECT_MIME = 'application/x-animator-effect';
export const PRESET_MIME = 'application/x-animator-preset';

export const Library: React.FC = () => {
  const addClip = useStore((s) => s.addClip);
  const addEffect = useStore((s) => s.addEffect);
  const addPreset = useStore((s) => s.addPreset);
  const selectedClipIds = useStore((s) => s.selectedClipIds);
  const project = useStore((s) => s.project);
  const currentFrame = useStore((s) => s.currentFrame);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = (label: string, description: string) =>
    q === '' || label.toLowerCase().includes(q) || description.toLowerCase().includes(q);

  const presetEntries = Object.entries(PRESETS).filter(([, p]) => matches(p.label, p.description));
  const elementKeys = (Object.keys(ELEMENTS) as ElementType[]).filter((k) =>
    matches(ELEMENTS[k].label, ELEMENTS[k].description),
  );
  const effectKeys = (Object.keys(EFFECTS) as EffectType[]).filter((k) =>
    matches(EFFECTS[k].label, EFFECTS[k].description),
  );

  const effectGroups: Array<{ title: string; keys: EffectType[] }> = [
    { title: 'Text', keys: effectKeys.filter((k) => EFFECTS[k].textOnly) },
    { title: 'Enter', keys: effectKeys.filter((k) => !EFFECTS[k].textOnly && EFFECTS[k].category === 'in') },
    { title: 'Exit', keys: effectKeys.filter((k) => !EFFECTS[k].textOnly && EFFECTS[k].category === 'out') },
    { title: 'Loops & Motion', keys: effectKeys.filter((k) => !EFFECTS[k].textOnly && EFFECTS[k].category === 'loop') },
    { title: 'Style & Color', keys: effectKeys.filter((k) => !EFFECTS[k].textOnly && EFFECTS[k].category === 'style') },
  ].filter((g) => g.keys.length > 0);

  return (
    <aside className="library">
      <div className="library-search-wrap">
        <input
          className="library-search"
          type="search"
          placeholder="🔎 Search presets, elements, effects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {presetEntries.length + elementKeys.length + effectKeys.length === 0 ? (
        <div className="library-hint">Nothing matches “{query}”.</div>
      ) : null}
      {presetEntries.length > 0 ? (
        <>
          <div className="panel-title">Presets</div>
          <div className="library-hint">Ready-made animations — double-click to insert at the playhead</div>
        </>
      ) : null}
      <div className="library-list">
        {presetEntries.map(([key, preset]) => (
          <div
            key={key}
            className="library-item preset-item"
            draggable
            title={preset.description}
            onDragStart={(e) => {
              e.dataTransfer.setData(PRESET_MIME, key);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onDoubleClick={() => addPreset(key, currentFrame)}
          >
            <span className="library-icon">{preset.icon}</span>
            <span>{preset.label}</span>
          </div>
        ))}
      </div>

      {elementKeys.length > 0 ? (
        <>
          <div className="panel-title" style={{ marginTop: 18 }}>
            Elements
          </div>
          <div className="library-hint">Drag onto a timeline track, or double-click to add</div>
        </>
      ) : null}
      <div className="library-grid">
        {elementKeys.map((key) => (
          <div
            key={key}
            className="library-item"
            draggable
            title={ELEMENTS[key].description}
            onDragStart={(e) => {
              e.dataTransfer.setData(ELEMENT_MIME, key);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onDoubleClick={() => {
              const track = project.tracks[0];
              if (track) addClip(key, track.id, currentFrame);
            }}
          >
            <span className="library-icon">{ELEMENTS[key].icon}</span>
            <span>{ELEMENTS[key].label}</span>
          </div>
        ))}
      </div>

      {effectKeys.length > 0 ? (
        <>
          <div className="panel-title" style={{ marginTop: 18 }}>
            Effects
          </div>
          <div className="library-hint">Drag onto a clip, or double-click to apply to selection</div>
        </>
      ) : null}
      {effectGroups.map((group) => (
        <React.Fragment key={group.title}>
          <div className="effect-cat">{group.title}</div>
          <div className="library-list">
            {group.keys.map((key) => (
              <div
                key={key}
                className="library-item effect-item"
                draggable
                title={EFFECTS[key].description}
                onDragStart={(e) => {
                  e.dataTransfer.setData(EFFECT_MIME, key);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onDoubleClick={() => {
                  for (const id of selectedClipIds) addEffect(id, key);
                }}
              >
                <span className="library-icon">{EFFECTS[key].icon}</span>
                <span>{EFFECTS[key].label}</span>
              </div>
            ))}
          </div>
        </React.Fragment>
      ))}
    </aside>
  );
};
