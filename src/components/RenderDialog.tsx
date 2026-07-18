import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

type Phase = 'idle' | 'starting' | 'bundling' | 'rendering' | 'done' | 'error' | 'no-server';

export const RenderDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const project = useStore((s) => s.project);
  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<number | null>(null);

  const outW = Math.round(project.width * scale);
  const outH = Math.round(project.height * scale);
  const seconds = (project.durationInFrames / project.fps).toFixed(1);

  const stopPolling = () => {
    if (pollRef.current !== null) window.clearInterval(pollRef.current);
    pollRef.current = null;
  };
  useEffect(() => stopPolling, []);

  const start = async () => {
    setPhase('starting');
    setError('');
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, options: { scale } }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const { id } = await res.json();
      setJobId(id);
      setPhase('bundling');
      pollRef.current = window.setInterval(async () => {
        try {
          const r = await fetch(`/api/job/${id}`);
          const job = await r.json();
          setProgress(job.progress ?? 0);
          if (job.status === 'rendering') setPhase('rendering');
          if (job.status === 'done') {
            setPhase('done');
            stopPolling();
          }
          if (job.status === 'error') {
            setPhase('error');
            setError(job.error ?? 'Unknown render error');
            stopPolling();
          }
        } catch {
          /* transient poll failure — keep trying */
        }
      }, 800);
    } catch {
      setPhase('no-server');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Export video</h3>

        {phase === 'idle' || phase === 'no-server' || phase === 'error' ? (
          <>
            <div className="param-row">
              <label>Resolution scale</label>
              <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
                <option value={0.5}>0.5× — {Math.round(project.width / 2)}×{Math.round(project.height / 2)} (draft)</option>
                <option value={1}>1× — {project.width}×{project.height}</option>
                <option value={2}>2× — {project.width * 2}×{project.height * 2}</option>
              </select>
            </div>
            <p className="dim">
              Output: <strong>{outW}×{outH}</strong> @ {project.fps}fps · {seconds}s · H.264 MP4
              <br />
              For native 4K60, set Size to a 4K preset and FPS to 60 in the top bar.
            </p>
            {phase === 'no-server' ? (
              <p className="render-error">
                Could not reach the render server. Start the app with <code>npm run dev</code> (it launches
                both the editor and the render server), or render from a terminal:{' '}
                <code>npm run render</code> after saving your project.json.
              </p>
            ) : null}
            {phase === 'error' ? <p className="render-error">Render failed: {error}</p> : null}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={start}>
                🎬 Start render
              </button>
              <button className="btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        ) : null}

        {phase === 'starting' || phase === 'bundling' ? (
          <p>Preparing the renderer… (first render bundles the composition, ~20s)</p>
        ) : null}

        {phase === 'rendering' ? (
          <>
            <p>
              Rendering {outW}×{outH} @ {project.fps}fps…
            </p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="dim">{Math.round(progress * 100)}%</p>
          </>
        ) : null}

        {phase === 'done' && jobId ? (
          <>
            <p>✅ Render complete!</p>
            <div className="modal-actions">
              <a className="btn btn-primary" href={`/api/download/${jobId}`}>
                ⬇ Download MP4
              </a>
              <button className="btn" onClick={onClose}>
                Close
              </button>
            </div>
            <p className="dim">Also saved to the <code>out/</code> folder of the project.</p>
          </>
        ) : null}
      </div>
    </div>
  );
};
