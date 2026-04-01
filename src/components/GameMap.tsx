import { useEffect, useRef, useState } from "react";
import type { Coordinates, TreasureLocation } from "../types/hunt";

interface GameMapProps {
  foundLocations: { id: string; coordinates: Coordinates }[];
  currentLocation: TreasureLocation | null;
  onNavigateStreetView: (lat: number, lng: number) => void;
  streetViewPosition?: Coordinates | null;
  initialPosition: Coordinates;
}

export function GameMap({
  foundLocations,
  currentLocation,
  onNavigateStreetView,
  streetViewPosition,
  initialPosition,
}: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [showMapTip, setShowMapTip] = useState(true);

  // initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new google.maps.Map(containerRef.current, {
      center: initialPosition,
      zoom: 2,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
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

  // render found markers and user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    const markers: google.maps.Marker[] = [];

    // found locations
    foundLocations.forEach((loc) => {
      markers.push(
        new google.maps.Marker({
          position: loc.coordinates,
          map,
          icon: {
            url: "/treasures/treasure-chest.svg",
            scaledSize: new google.maps.Size(36, 36),
          },
          title: `Found: ${loc.id}`,
        }),
      );
    });

    // current hunt location marker (only show in dev mode)
    if (currentLocation && import.meta.env.DEV) {
      markers.push(
        new google.maps.Marker({
          position: currentLocation.coordinates,
          map,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: "#FFD600",
            fillOpacity: 1,
            strokeColor: "#B8860B",
            strokeWeight: 2,
          },
          title: `Current clue: ${currentLocation.name}`,
          zIndex: 999,
        }),
      );
    }

    // street view position marker
    if (streetViewPosition) {
      markers.push(
        new google.maps.Marker({
          position: streetViewPosition,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#1976d2",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
          title: "Street View position",
          zIndex: 1000,
        }),
      );
    }

    markersRef.current = markers;
  }, [foundLocations, currentLocation, streetViewPosition]);

  // const handleFlyToHint = useCallback(() => {
  //   if (!currentLocation || !mapRef.current) return;
  //   // zoom to general area (not exact — that would be a spoiler)
  //   mapRef.current.setCenter(currentLocation.coordinates);
  //   mapRef.current.setZoom(12);
  // }, [currentLocation]);

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
