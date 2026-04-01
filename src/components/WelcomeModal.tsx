import { useEffect, useRef, useState } from "react";

interface WelcomeModalProps {
  huntName: string;
  howToPlay: string;
  // firstClue?: string;
  onClose: () => void;
}

export function WelcomeModal({
  huntName,
  howToPlay,
  // firstClue,
  onClose,
}: WelcomeModalProps) {
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
        <div className="welcome-modal__body">
          <h2>Welcome to {huntName}!</h2>
          {/* <p className="welcome-modal__subtitle">{huntName}</p> */}
          <p className="welcome-modal__message">
            Let's hunt for some treasures! Each treasure is hidden somewhere
            related to baby's life. To find it, you get clues that will help
            you. Once you find the next treasure, you'll get the next clue.
          </p>
          <hr className="welcome-modal__divider" />
          <p className="welcome-modal__message">{howToPlay}</p>

          {/* {firstClue && (
          <div className="welcome-modal__clue">
            <h3>Your first clue</h3>
            <p>{firstClue}</p>
          </div>
        )} */}

          <button className="welcome-modal__button" onClick={handleClose}>
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
