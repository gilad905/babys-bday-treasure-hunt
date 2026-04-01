import { useEffect, useRef, useState } from "react";

interface WelcomeModalProps {
  huntName: string;
  firstClue?: string;
  onClose: () => void;
}

export function WelcomeModal({ huntName, firstClue, onClose }: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 180);
  };

  return (
    <div className={`welcome-modal ${visible ? "welcome-modal--visible" : ""}`}>
      <div className="welcome-modal__card">
        <h2>Welcome to the hunt!</h2>
        <p className="welcome-modal__subtitle">{huntName}</p>
        <p className="welcome-modal__message">
          Explore the map, jump into Street View, and look around carefully for each treasure.
        </p>

        {firstClue && (
          <div className="welcome-modal__clue">
            <h3>Your first clue</h3>
            <p>{firstClue}</p>
          </div>
        )}

        <button className="welcome-modal__button" onClick={handleClose}>
          Start Exploring
        </button>
      </div>
    </div>
  );
}
