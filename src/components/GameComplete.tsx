import type { TreasureHunt, GameState } from "../types/hunt";

interface GameCompleteProps {
  hunt: TreasureHunt;
  state: GameState;
  onPlayAgain: () => void;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function GameComplete({ hunt, state, onPlayAgain }: GameCompleteProps) {
  const duration = state.completedAt ? state.completedAt - state.startedAt : 0;

  return (
    <div className="game-complete">
      <div className="game-complete__card">
        <div className="game-complete__icon">🏆</div>
        <h1>Hunt Complete!</h1>
        <h2>{hunt.name}</h2>
        <p className="game-complete__description">
          You found all {hunt.locations.length} treasures!
        </p>

        <div className="game-complete__stats">
          <div className="game-complete__stat">
            <span className="game-complete__stat-value">
              {hunt.locations.length}
            </span>
            <span className="game-complete__stat-label">Treasures Found</span>
          </div>
          {duration > 0 && (
            <div className="game-complete__stat">
              <span className="game-complete__stat-value">
                {formatDuration(duration)}
              </span>
              <span className="game-complete__stat-label">Total Time</span>
            </div>
          )}
        </div>

        <div className="game-complete__locations">
          <h3>Locations Discovered</h3>
          <ul>
            {hunt.locations.map((loc) => (
              <li key={loc.id}>🎉 You found {loc.name}!</li>
            ))}
          </ul>
        </div>

        <button className="game-complete__button" onClick={onPlayAgain}>
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
