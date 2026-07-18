import React from 'react';

export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
      <h3>How to use Remotion Animator</h3>
      <div className="help-cols">
        <div>
          <h4>Building</h4>
          <ul>
            <li><strong>Presets</strong> — double-click (or drag onto the timeline) for ready-made animations: lower thirds, glitch titles, tickers…</li>
            <li><strong>Elements</strong> — drag Text, Shape, Image, Video, Audio, GIF, Counter, Emoji or Background onto a track.</li>
            <li><strong>Effects</strong> — drag onto a clip, or double-click to apply to the selected clip. Stack as many as you like.</li>
            <li><strong>Canvas</strong> — with a clip selected, drag on the preview to reposition it.</li>
            <li><strong>Inspector</strong> — every parameter of the selected clip and its effects.</li>
          </ul>
          <h4>Timeline</h4>
          <ul>
            <li>Drag a clip to move it; drag its edges to trim.</li>
            <li>Click/drag the ruler to scrub.</li>
            <li>Shift-click a lane to move the selected clip to that track.</li>
            <li>“+ Track” adds a layer (top track renders on top).</li>
          </ul>
        </div>
        <div>
          <h4>Shortcuts</h4>
          <ul>
            <li><code>Space</code> — play / pause</li>
            <li><code>Delete</code> — remove selected clip</li>
            <li><code>⌘Z</code> / <code>⇧⌘Z</code> — undo / redo</li>
          </ul>
          <h4>Saving</h4>
          <ul>
            <li>Your work autosaves to the browser and is restored on reload.</li>
            <li><strong>Save / Open</strong> — export/import projects as JSON files.</li>
          </ul>
          <h4>Exporting</h4>
          <ul>
            <li><strong>Export MP4</strong> renders on the local render server with a progress bar.</li>
            <li>Any size up to 4K60: pick a Size preset (or custom W×H) and FPS in the top bar.</li>
            <li>CLI alternative: <code>npm run render -- project.json</code>.</li>
          </ul>
          <p className="dim">Full docs: see <code>DOCS.md</code> in the project folder.</p>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);
