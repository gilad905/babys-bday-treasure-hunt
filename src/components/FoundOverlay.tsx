import { useState, useEffect } from 'react';

interface FoundOverlayProps {
  message: string;
  nextClue: string | null;
  onContinue: () => void;
}

export function FoundOverlay({ message, nextClue, onContinue }: FoundOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // trigger entrance animation
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <div className={`found-overlay ${show ? 'found-overlay--visible' : ''}`}>
      <div className="found-overlay__card">
        <div className="found-overlay__icon">🎉</div>
        <h2>Treasure Found!</h2>
        <p className="found-overlay__message">{message}</p>

        {nextClue && (
          <div className="found-overlay__next">
            <h3>Next Clue:</h3>
            <p>{nextClue}</p>
          </div>
        )}

        <button className="found-overlay__button" onClick={onContinue}>
          {nextClue ? 'Continue Hunt →' : 'See Results'}
        </button>
      </div>
    </div>
  );
}
