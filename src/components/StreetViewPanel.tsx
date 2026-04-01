import { useEffect, useRef, useState, useCallback } from "react";
import type { TreasureLocation, Coordinates } from "../types/hunt";
import { TreasureMarker } from "./TreasureMarker";

interface StreetViewPanelProps {
  currentLocation: TreasureLocation | null;
  foundLocations: Coordinates[];
  onTreasureFound: () => void;
  initialPosition: Coordinates;
  onPositionChange?: (pos: Coordinates) => void;
  compassCount: number;
  onUseCompass: () => void;
}

function computeDistance(a: google.maps.LatLng, b: google.maps.LatLng): number {
  return google.maps.geometry.spherical.computeDistanceBetween(a, b);
}

export function StreetViewPanel({
  currentLocation,
  foundLocations,
  onTreasureFound,
  initialPosition,
  onPositionChange,
  compassCount,
  onUseCompass,
}: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isNearTreasure, setIsNearTreasure] = useState(false);
  const [isNearMarker, setIsNearMarker] = useState(false);
  const [svAvailable, setSvAvailable] = useState(true);
  // compassCount is now managed by game state
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [showDistance, setShowDistance] = useState(false);

  // initialize panorama
  useEffect(() => {
    if (!containerRef.current) return;

    const startPos = initialPosition;
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
      if (typeof onPositionChange === "function") {
        onPositionChange({ lat: pos.lat(), lng: pos.lng() });
      }
      const { lat, lng } = currentLocation.coordinates;
      const targetLatLng = new google.maps.LatLng(lat, lng);
      const distance = computeDistance(pos, targetLatLng);
      setIsNearTreasure(distance <= currentLocation.nearRadius);
      setIsNearMarker(distance <= currentLocation.markerRadius);
    });

    // call onPositionChange initially
    const pos = panorama.getPosition();
    if (pos && typeof onPositionChange === "function") {
      onPositionChange({ lat: pos.lat(), lng: pos.lng() });
    }

    return () => {
      google.maps.event.removeListener(listener);
      setIsNearTreasure(false);
      setIsNearMarker(false);
    };
  }, [currentLocation, onPositionChange]);

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

  const getDistanceString = (distance: number | null): string => {
    if (distance === null) return "";
    const distanceKm = distance / 1000;
    if (distanceKm < 1) {
      return `You are ${distance.toFixed(0)} meters away!`;
    } else if (distanceKm < 5000) {
      return `You are ${distanceKm.toFixed(0)} km away`;
    } else {
      return `You are ${distanceKm.toFixed(0)} km away... Try a different country?`;
    }
  };

  // handle compass button click
  const handleCompass = () => {
    if (!currentLocation) return;
    const panorama = panoramaRef.current;
    if (!panorama) return;
    const pos = panorama.getPosition();
    if (!pos) return;
    const { lat, lng } = currentLocation.coordinates;
    const targetLatLng = new google.maps.LatLng(lat, lng);
    const distance = computeDistance(pos, targetLatLng);
    setLastDistance(distance);
    setShowDistance(true);
    onUseCompass();
    setTimeout(() => setShowDistance(false), 3500);
  };

  return (
    <div className="street-view-panel">
      <div ref={containerRef} className="street-view-container" />
      <button
        className="compass-btn"
        onClick={handleCompass}
        disabled={compassCount <= 0 || !currentLocation}
        style={{ position: "absolute", top: 10, right: 60, zIndex: 10 }}
      >
        🧭 Compass ({compassCount})
      </button>
      {showDistance && lastDistance !== null && (
        <div
          className="compass-distance"
          style={{
            position: "absolute",
            top: 50,
            right: 60,
            background: "#222b",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            zIndex: 11,
          }}
        >
          {getDistanceString(lastDistance)}
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
          visible={isNearMarker}
          onFound={onTreasureFound}
        />
      )}
      {isNearTreasure && currentLocation && (
        <div className="proximity-alert">
          <span className="proximity-alert__icon">🔥</span>
          You're getting close!
        </div>
      )}
    </div>
  );
}
