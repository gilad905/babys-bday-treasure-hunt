import type { TreasureLocation } from '../types/hunt';

interface CluePanelProps {
  location: TreasureLocation;
  progress: { current: number; total: number };
  onReset: () => void;
}

export function CluePanel({ location, progress, onReset }: CluePanelProps) {
  return (
    <div className="clue-panel">
      <div className="clue-panel__header">
        <h2>🗺️ Treasure Hunt</h2>
        <span className="clue-panel__progress">
          Location {progress.current + 1} of {progress.total}
        </span>
      </div>

      <div className="clue-panel__progress-bar">
        <div
          className="clue-panel__progress-fill"
          style={{ width: `${(progress.current / progress.total) * 100}%` }}
        />
      </div>

      <div className="clue-panel__clue">
        <h3>📜 Clue</h3>
        <p>{location.clue}</p>
      </div>

      <div className="clue-panel__instructions">
        <p>
          <strong>How to play:</strong> Use the map to explore the world. Double-click any location to
          open Street View there. Navigate in Street View to find the treasure marker. When you're
          close enough, the treasure will appear — click it to collect!
        </p>
      </div>

      <button className="clue-panel__reset" onClick={onReset}>
        🔄 Restart Hunt
      </button>
    </div>
  );
}
