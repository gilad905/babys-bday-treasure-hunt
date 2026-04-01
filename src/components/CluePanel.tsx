import type { TreasureLocation } from "../types/hunt";

interface CluePanelProps {
  huntName: string;
  howToPlay: string;
  location: TreasureLocation;
  progress: { current: number; total: number };
  onReset: () => void;
}

export function CluePanel({
  huntName,
  howToPlay,
  location,
  progress,
  onReset,
}: CluePanelProps) {
  return (
    <div className="clue-panel">
      <div className="clue-panel__header">
        <h2>{huntName}</h2>
        <span className="clue-panel__progress">
          Treasure {progress.current + 1} of {progress.total}
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
          <strong>How to play:</strong>
          {howToPlay}
        </p>
      </div>

      <button className="clue-panel__reset" onClick={onReset}>
        🔄 Restart Hunt
      </button>
    </div>
  );
}
