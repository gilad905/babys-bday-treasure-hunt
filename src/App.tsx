import { useState, useCallback, useRef } from "react";
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
import type { TreasureHunt, Coordinates } from "./types/hunt";
import "./App.css";

const hunt = realHunt as TreasureHunt;
// const hunt = sampleHunt as TreasureHunt;
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

type Screen = "start" | "playing" | "found" | "complete";
const initialPosition: Coordinates = {
  lat: 52.50315974350624,
  lng: 13.293348498355584,
};

function App() {
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
  const [streetViewPosition, setStreetViewPosition] =
    useState<Coordinates | null>(null);

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

  // derive found locations with coordinates for map markers
  const foundLocationsData = hunt.locations
    .filter((loc) => state?.foundLocations.includes(loc.id))
    .map((loc) => ({ id: loc.id, coordinates: loc.coordinates }))
    .map((loc) => {
      return { id: loc.id, coordinates: loc.coordinates };
    });

  // derive next clue for found overlay
  const nextClue =
    state && state.currentLocationIndex + 1 < hunt.locations.length
      ? hunt.locations[state.currentLocationIndex + 1].clue
      : null;

  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    return (
      <div className="api-key-missing">
        <h1>🗺️ Baby's Bday Treasure Hunt</h1>
        <p>
          To play, you need a Google Maps API key. Create one at{" "}
          <a
            href="https://console.cloud.google.com/google/maps-apis"
            target="_blank"
            rel="noreferrer"
          >
            Google Cloud Console
          </a>{" "}
          and add it to your <code>.env</code> file:
        </p>
        <pre>VITE_GOOGLE_MAPS_API_KEY=your_key_here</pre>
        <p>
          Make sure to enable the <strong>Maps JavaScript API</strong> and{" "}
          <strong>Street View</strong> for your key.
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
                location={currentLocation}
                progress={progress}
                onReset={handleReset}
              />
            </aside>
            <main className="game-layout__main">
              <div className="game-layout__map">
                <GameMap
                  initialPosition={initialPosition}
                  foundLocations={foundLocationsData}
                  currentLocation={currentLocation}
                  onNavigateStreetView={handleNavigateStreetView}
                  streetViewPosition={streetViewPosition}
                />
              </div>
              <div className="game-layout__street-view" ref={streetViewRef}>
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
                firstClue={hunt.locations[0]?.clue}
                onClose={() => setShowWelcomeModal(false)}
              />
            )}
          </div>
        )}
    </APIProvider>
  );
}

export default App;
