import { useEffect, useRef, useCallback, useState } from "react";
import type { Coordinates, TreasureLocation } from "../types/hunt";

interface GameMapProps {
  foundLocations: { id: string; coordinates: Coordinates }[];
  currentLocation: TreasureLocation | null;
  onNavigateStreetView: (lat: number, lng: number) => void;
}

export function GameMap({
  foundLocations,
  currentLocation,
  onNavigateStreetView,
}: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [showMapTip, setShowMapTip] = useState(true);

  // initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new google.maps.Map(containerRef.current, {
      center: { lat: 48.8584, lng: 2.2945 },
      zoom: 3,
      streetViewControl: false,
      mapTypeControl: false,
      styles: [
        {
          featureType: "poi",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
    mapRef.current = map;

    // double-click on the map opens street view at that location
    map.addListener("dblclick", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onNavigateStreetView(e.latLng.lat(), e.latLng.lng());
        setShowMapTip(false);
      }
    });

    return () => {
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update navigate handler when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const listener = map.addListener(
      "dblclick",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onNavigateStreetView(e.latLng.lat(), e.latLng.lng());
          setShowMapTip(false);
        }
      },
    );
    return () => google.maps.event.removeListener(listener);
  }, [onNavigateStreetView]);

  // render found markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // clear old markers
    markersRef.current.forEach((m) => m.setMap(null));

    const markers = foundLocations.map((loc) => {
      return new google.maps.Marker({
        position: loc.coordinates,
        map,
        icon: {
          url: "/treasures/treasure-chest.svg",
          scaledSize: new google.maps.Size(36, 36),
        },
        title: `Found: ${loc.id}`,
      });
    });

    markersRef.current = markers;
  }, [foundLocations]);

  const handleFlyToHint = useCallback(() => {
    if (!currentLocation || !mapRef.current) return;
    // zoom to general area (not exact — that would be a spoiler)
    const [lat, lng] = currentLocation.coordinates.split(",").map(Number);
    const coords = { lat, lng };
    mapRef.current.setCenter(coords);
    mapRef.current.setZoom(12);
  }, [currentLocation]);

  return (
    <div className="game-map-panel">
      <div ref={containerRef} className="game-map-container" />
      {/* {currentLocation && (
        <button
          className="hint-button"
          onClick={handleFlyToHint}
          title="Get a hint – zoom to the general area"
        >
          💡 Hint
        </button>
      )} */}
      {showMapTip && (
        <div className="map-tip">
          Double-click the map to explore that area in Street View
        </div>
      )}
    </div>
  );
}
