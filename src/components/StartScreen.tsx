import type { TreasureHunt } from '../types/hunt';

interface StartScreenProps {
  hunt: TreasureHunt;
  hasExistingProgress: boolean;
  onStart: () => void;
  onResume: () => void;
}

export function StartScreen({ hunt, hasExistingProgress, onStart, onResume }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="start-screen__card">
        <div className="start-screen__icon">🗺️</div>
        <h1>{hunt.name}</h1>
        <p className="start-screen__description">{hunt.description}</p>

        <div className="start-screen__info">
          <div className="start-screen__info-item">
            <span className="start-screen__info-value">{hunt.locations.length}</span>
            <span className="start-screen__info-label">Treasures</span>
          </div>
        </div>

        <div className="start-screen__actions">
          {hasExistingProgress && (
            <button className="start-screen__button start-screen__button--primary" onClick={onResume}>
              ▶️ Resume Hunt
            </button>
          )}
          <button
            className={`start-screen__button ${hasExistingProgress ? 'start-screen__button--secondary' : 'start-screen__button--primary'}`}
            onClick={onStart}
          >
            {hasExistingProgress ? '🔄 Start Over' : '🚀 Start Hunt'}
          </button>
        </div>
      </div>
    </div>
  );
}
