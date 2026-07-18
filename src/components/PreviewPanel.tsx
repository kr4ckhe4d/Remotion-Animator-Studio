import { Player } from '@remotion/player';
import React, { useEffect, useRef } from 'react';
import { playerRef } from '../playerRef';
import { MainComposition } from '../remotion/MainComposition';
import { findClip, useStore } from '../store';

export const PreviewPanel: React.FC = () => {
  const project = useStore((s) => s.project);
  const muted = useStore((s) => s.muted);
  const selectedClipId = useStore((s) => s.selectedClipIds[0] ?? null);
  const setCurrentFrame = useStore((s) => s.setCurrentFrame);
  const setPlaying = useStore((s) => s.setPlaying);
  const commit = useStore((s) => s.commit);
  const updateClipProps = useStore((s) => s.updateClipProps);

  const drawingPath = useStore((s) => s.drawingPath);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Keep the store's frame/playing state in sync with the Player
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setCurrentFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
    };
  }, [setCurrentFrame, setPlaying]);

  // Drag the selected element around the canvas
  const onPointerDown = (e: React.PointerEvent) => {
    if (useStore.getState().drawingPath) return; // clicks belong to the path tool
    const clip = findClip(useStore.getState().project, selectedClipId);
    if (!clip || typeof clip.props.x !== 'number') return;
    commit();
    drag.current = { startX: e.clientX, startY: e.clientY, origX: clip.props.x, origY: clip.props.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !selectedClipId || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const scale = rect.width / project.width;
    updateClipProps(selectedClipId, {
      x: Math.round(drag.current.origX + (e.clientX - drag.current.startX) / scale),
      y: Math.round(drag.current.origY + (e.clientY - drag.current.startY) / scale),
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const selected = findClip(project, selectedClipId);
  const canDrag = selected && typeof selected.props.x === 'number';

  return (
    <div className="preview-panel">
      <div
        className="preview-stage"
        ref={wrapperRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: canDrag ? 'move' : 'default', aspectRatio: `${project.width} / ${project.height}` }}
      >
        <Player
          ref={playerRef}
          component={MainComposition}
          inputProps={{ project }}
          durationInFrames={Math.max(1, project.durationInFrames)}
          fps={project.fps}
          compositionWidth={project.width}
          compositionHeight={project.height}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          loop
          initiallyMuted={muted}
          acknowledgeRemotionLicense
        />
        {drawingPath ? (
          <div
            className="draw-overlay"
            onPointerDown={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const scale = rect.width / project.width;
              useStore.getState().addDrawingPoint({
                x: (e.clientX - rect.left) / scale,
                y: (e.clientY - rect.top) / scale,
              });
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              useStore.getState().finishDrawingPath();
            }}
          >
            <svg viewBox={`0 0 ${project.width} ${project.height}`} preserveAspectRatio="none">
              <polyline
                points={drawingPath.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#7c5cff"
                strokeWidth={4}
                strokeDasharray="10 8"
              />
              {drawingPath.points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 12 : 8} fill={i === 0 ? '#6ee7a8' : '#7c5cff'} />
              ))}
            </svg>
            <div className="draw-toolbar">
              <span>
                Click to add points ({drawingPath.points.length}) — the element starts at the green dot
              </span>
              <button className="btn btn-small btn-primary" onClick={() => useStore.getState().finishDrawingPath()}>
                ✓ Done (Enter)
              </button>
              <button className="btn btn-small" onClick={() => useStore.getState().cancelDrawingPath()}>
                ✕ Cancel (Esc)
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {canDrag && !drawingPath ? (
        <div className="preview-hint">Drag anywhere on the canvas to move “{selected!.name}”</div>
      ) : null}
    </div>
  );
};
