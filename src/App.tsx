import { useState, useCallback, useRef, useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useGameState } from "./hooks/useGameState";
import { StartScreen } from "./components/StartScreen";
import { GameComplete } from "./components/GameComplete";
import { CluePanel } from "./components/CluePanel";
import { GameMap } from "./components/GameMap";
import { StreetViewPanel } from "./components/StreetViewPanel";
import { FoundOverlay } from "./components/FoundOverlay";
import { WelcomeModal } from "./components/WelcomeModal";
// import sampleHunt from "./data/sample-hunt.json";
import realHunt from "./data/hunt.json";
import { HUNT_NAME, HOW_TO_PLAY } from "./constants/hunt";
import type { TreasureHunt, Coordinates } from "./types/hunt";
import "./App.css";

const hunt = { ...realHunt, name: HUNT_NAME } as TreasureHunt;
// const hunt = sampleHunt as TreasureHunt;
const API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_CLIENT_KEY as string) ||
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string);

type Screen = "start" | "playing" | "found" | "complete";
const initialPosition: Coordinates = {
  lat: 52.50315974350624,
  lng: 13.293348498355584,
};

function App() {
  useEffect(() => {
    document.title = HUNT_NAME.replace(/\p{Extended_Pictographic}/gu, '');
  }, []);

  const {
    state,
    currentLocation,
    progress,
    startGame,
    foundLocation,
    resetGame,
    decrementCompassCount,
  } = useGameState(hunt);
  const [screen, setScreen] = useState<Screen>(state ? "playing" : "start");
  const [justFoundMessage, setJustFoundMessage] = useState("");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mainPanelsRef = useRef<HTMLElement>(null);
  const isResizingPanelsRef = useRef(false);
  const [streetViewPosition, setStreetViewPosition] =
    useState<Coordinates | null>(null);
  const [mapPanelSize, setMapPanelSize] = useState(50);

  const updatePanelSplit = useCallback((clientY: number) => {
    const container = mainPanelsRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.height <= 0) return;
    const nextSize = ((clientY - rect.top) / rect.height) * 100;
    const clampedSize = Math.max(20, Math.min(80, nextSize));
    setMapPanelSize(clampedSize);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizingPanelsRef.current) return;
      updatePanelSplit(event.clientY);
    };

    const handlePointerUp = () => {
      if (!isResizingPanelsRef.current) return;
      isResizingPanelsRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [updatePanelSplit]);

  const handleStart = useCallback(() => {
    startGame();
    setScreen("playing");
    setShowWelcomeModal(true);
  }, [startGame]);

  const handleResume = useCallback(() => {
    setScreen("playing");
  }, []);

  const handleTreasureFound = useCallback(() => {
    if (!currentLocation) return;
    setJustFoundMessage(`🎉 You found ${currentLocation.name}!`);
    setScreen("found");
  }, [currentLocation]);

  const handleFoundContinue = useCallback(() => {
    foundLocation();
    // after state update, check if game is complete
    if (state && state.currentLocationIndex + 1 >= hunt.locations.length) {
      setScreen("complete");
    } else {
      setScreen("playing");
    }
  }, [foundLocation, state]);

  const handleReset = useCallback(() => {
    resetGame();
    setScreen("start");
    setShowWelcomeModal(false);
  }, [resetGame]);

  const handleNavigateStreetView = useCallback((lat: number, lng: number) => {
    const el = streetViewRef.current;
    if (!el) return;
    const container = el.querySelector(
      ".street-view-container",
    ) as HTMLDivElement & {
      navigateTo?: (lat: number, lng: number) => void;
    };
    container?.navigateTo?.(lat, lng);
  }, []);

  const handleResizeStart = useCallback(() => {
    isResizingPanelsRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMapPanelSize((prev) => Math.max(20, prev - 2));
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMapPanelSize((prev) => Math.min(80, prev + 2));
      }
    },
    [],
  );

  // derive found locations with coordinates for map markers
  const foundLocationsData = hunt.locations
    .filter((loc) => state?.foundLocations.includes(loc.id))
    .map((loc) => ({ id: loc.id, coordinates: loc.coordinates, name: loc.name }));

  // derive next clue for found overlay
  const nextClue =
    state && state.currentLocationIndex + 1 < hunt.locations.length
      ? hunt.locations[state.currentLocationIndex + 1].clue
      : null;

  if (!API_KEY || API_KEY === "YOUR_PUBLIC_BROWSER_KEY_HERE") {
    return (
      <div className="api-key-missing">
        <h1>{HUNT_NAME}</h1>
        <p>
          To play, you need a Google Maps browser key. Create one at{" "}
          <a
            href="https://console.cloud.google.com/google/maps-apis"
            target="_blank"
            rel="noreferrer"
          >
            Google Cloud Console
          </a>{" "}
          and provide it as <code>VITE_GOOGLE_MAPS_CLIENT_KEY</code> in your
          build environment (or local <code>.env</code>):
        </p>
        <pre>VITE_GOOGLE_MAPS_CLIENT_KEY=your_public_browser_key_here</pre>
        <p>
          make sure to enable the <strong>Maps JavaScript API</strong>, lock the
          key to your domain with HTTP referrer restrictions, and keep any
          server key in your backend only.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} libraries={["geometry"]}>
      {screen === "start" && (
        <StartScreen
          hunt={hunt}
          hasExistingProgress={!!state}
          onStart={handleStart}
          onResume={handleResume}
        />
      )}

      {screen === "complete" && state && (
        <GameComplete hunt={hunt} state={state} onPlayAgain={handleReset} />
      )}

      {(screen === "playing" || screen === "found") &&
        currentLocation &&
        progress && (
          <div className="game-layout">
            <aside className="game-layout__sidebar">
              <CluePanel
                huntName={HUNT_NAME}
                howToPlay={HOW_TO_PLAY}
                location={currentLocation}
                progress={progress}
                onReset={handleReset}
              />
            </aside>
            <main className="game-layout__main" ref={mainPanelsRef}>
              <div
                className="game-layout__map"
                style={{ flex: `0 0 ${mapPanelSize}%` }}
              >
                <GameMap
                  initialPosition={initialPosition}
                  foundLocations={foundLocationsData}
                  currentLocation={currentLocation}
                  onNavigateStreetView={handleNavigateStreetView}
                  streetViewPosition={streetViewPosition}
                />
              </div>
              <div
                className="game-layout__panel-resizer"
                role="separator"
                aria-orientation="horizontal"
                aria-label="Resize map and street view panels"
                tabIndex={0}
                onPointerDown={handleResizeStart}
                onKeyDown={handleResizeKeyDown}
              />
              <div
                className="game-layout__street-view"
                ref={streetViewRef}
                style={{ flex: `0 0 ${100 - mapPanelSize}%` }}
              >
                <StreetViewPanel
                  initialPosition={initialPosition}
                  currentLocation={currentLocation}
                  foundLocations={foundLocationsData.map((l) => l.coordinates)}
                  onTreasureFound={handleTreasureFound}
                  onPositionChange={setStreetViewPosition}
                  compassCount={state?.compassCount ?? 10}
                  onUseCompass={decrementCompassCount}
                />
              </div>
            </main>

            {screen === "found" && (
              <FoundOverlay
                message={justFoundMessage}
                nextClue={nextClue}
                onContinue={handleFoundContinue}
              />
            )}

            {showWelcomeModal && (
              <WelcomeModal
                huntName={hunt.name}
                howToPlay={HOW_TO_PLAY}
                // firstClue={hunt.locations[0]?.clue}
                onClose={() => setShowWelcomeModal(false)}
              />
            )}
          </div>
        )}
    </APIProvider>
  );
}

export default App;
