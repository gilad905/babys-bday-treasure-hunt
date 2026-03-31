import { useEffect, useRef, useState, useCallback } from "react";
import type {
  TreasureLocation,
  Coordinates,
  TreasureHunt,
} from "../types/hunt";
import { TreasureMarker } from "./TreasureMarker";

interface StreetViewPanelProps {
  hunt: TreasureHunt;
  currentLocation: TreasureLocation | null;
  foundLocations: Coordinates[];
  onTreasureFound: () => void;
  initialPosition?: Coordinates;
}

function computeDistance(a: google.maps.LatLng, b: google.maps.LatLng): number {
  return google.maps.geometry.spherical.computeDistanceBetween(a, b);
}

export function StreetViewPanel({
  hunt,
  currentLocation,
  foundLocations,
  onTreasureFound,
  initialPosition,
}: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isNearTreasure, setIsNearTreasure] = useState(false);
  const [svAvailable, setSvAvailable] = useState(true);
  const [compassesLeft, setCompassesLeft] = useState(10);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [showDistance, setShowDistance] = useState(false);

  // initialize panorama
  useEffect(() => {
    if (!containerRef.current) return;

    const startPos = initialPosition ?? { lat: 48.8584, lng: 2.2945 };
    const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
      position: startPos,
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      addressControl: true,
      linksControl: true,
      panControl: true,
      enableCloseButton: false,
      fullscreenControl: true,
    });

    panoramaRef.current = panorama;

    return () => {
      panoramaRef.current = null;
    };
  }, [initialPosition]);

  // proximity detection: check distance whenever position changes
  useEffect(() => {
    const panorama = panoramaRef.current;
    if (!panorama || !currentLocation) return;

    const listener = panorama.addListener("position_changed", () => {
      const pos = panorama.getPosition();
      if (!pos) return;
      const [lat, lng] = currentLocation.coordinates.split(",").map(Number);
      const targetLatLng = new google.maps.LatLng(lat, lng);
      const distance = computeDistance(pos, targetLatLng);
      setIsNearTreasure(distance <= hunt.proximityRadius);
    });

    return () => {
      google.maps.event.removeListener(listener);
      setIsNearTreasure(false);
    };
  }, [currentLocation, hunt.proximityRadius]);

  // check street view availability when navigating
  useEffect(() => {
    const panorama = panoramaRef.current;
    if (!panorama) return;
    const listener = panorama.addListener("status_changed", () => {
      setSvAvailable(panorama.getStatus() === google.maps.StreetViewStatus.OK);
    });
    return () => google.maps.event.removeListener(listener);
  }, []);

  const navigateTo = useCallback(
    (lat: number, lng: number, heading?: number, pitch?: number) => {
      const panorama = panoramaRef.current;
      if (!panorama) return;
      const sv = new google.maps.StreetViewService();
      sv.getPanorama({ location: { lat, lng }, radius: 200 })
        .then(({ data }) => {
          if (data.location?.pano) {
            panorama.setPano(data.location.pano);
            if (heading !== undefined && pitch !== undefined) {
              panorama.setPov({ heading, pitch });
            }
            setSvAvailable(true);
          }
        })
        .catch(() => {
          setSvAvailable(false);
        });
    },
    [],
  );

  // expose navigateTo on the container element for the parent to call
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      (el as HTMLDivElement & { navigateTo?: typeof navigateTo }).navigateTo =
        navigateTo;
    }
  }, [navigateTo]);

  // render found-location markers on the panorama
  useEffect(() => {
    const panorama = panoramaRef.current;
    if (!panorama) return;

    const markers: google.maps.Marker[] = foundLocations.map((coord) => {
      return new google.maps.Marker({
        position: coord,
        map: panorama as unknown as google.maps.Map,
        icon: {
          url: "/treasures/treasure-chest.svg",
          scaledSize: new google.maps.Size(32, 32),
        },
        opacity: 0.6,
      });
    });

    return () => {
      markers.forEach((m) => m.setMap(null));
    };
  }, [foundLocations]);

  // handle compass button click
  const handleCompass = () => {
    if (!currentLocation || compassesLeft <= 0) return;
    const panorama = panoramaRef.current;
    if (!panorama) return;
    const pos = panorama.getPosition();
    if (!pos) return;
    const [lat, lng] = currentLocation.coordinates.split(",").map(Number);
    const targetLatLng = new google.maps.LatLng(lat, lng);
    const distance = computeDistance(pos, targetLatLng);
    setLastDistance(distance);
    setShowDistance(true);
    setCompassesLeft((prev) => prev - 1);
    setTimeout(() => setShowDistance(false), 3500);
  };

  return (
    <div className="street-view-panel">
      <div ref={containerRef} className="street-view-container" />
      <button
        className="compass-btn"
        onClick={handleCompass}
        disabled={compassesLeft <= 0 || !currentLocation}
        style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
      >
        🧭 Compass ({compassesLeft})
      </button>
      {showDistance && lastDistance !== null && (
        <div className="compass-distance" style={{ position: "absolute", top: 60, right: 16, background: "#222b", color: "#fff", padding: "10px 18px", borderRadius: 8, zIndex: 11 }}>
          {`You are ${(lastDistance < 1000 ? lastDistance.toFixed(1) + ' m' : (lastDistance/1000).toFixed(2) + ' km')} from the clue.`}
        </div>
      )}
      {!svAvailable && (
        <div className="street-view-unavailable">
          <p>
            Street View is not available at this location. Try navigating to a
            nearby road.
          </p>
        </div>
      )}
      {currentLocation && (
        <TreasureMarker
          panorama={panoramaRef.current}
          location={currentLocation}
          visible={isNearTreasure}
          onFound={onTreasureFound}
        />
      )}
      {isNearTreasure && currentLocation && (
        <div className="proximity-alert">
          <span className="proximity-alert__icon">🔥</span>
          You're close! Look around for the treasure!
        </div>
      )}
    </div>
  );
}
