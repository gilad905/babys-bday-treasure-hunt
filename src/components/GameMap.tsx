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
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  // get user geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

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
        })
      );
    });


    // user location marker
    if (userLocation) {
      markers.push(
        new google.maps.Marker({
          position: userLocation,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          },
          title: "Your location",
        })
      );
    }

    // current hunt location marker
    if (currentLocation) {
      const [lat, lng] = currentLocation.coordinates.split(",").map(Number);
      markers.push(
        new google.maps.Marker({
          position: { lat, lng },
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
        })
      );
    }

    markersRef.current = markers;
  }, [foundLocations, userLocation]);

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
