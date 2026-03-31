export interface Coordinates {
  lat: number;
  lng: number;
}

export interface StreetViewPov {
  heading: number;
  pitch: number;
}

export interface TreasureLocation {
  id: string;
  name: string;
  coordinatesText: string;
  coordinates: Coordinates;
  clue: string;
  clueHidden: string;
  imageUrl: string;
  // suggested street view camera angle for viewing the treasure
  streetViewPov: StreetViewPov;
  // how close (meters) the player must be in street view to see the marker
  proximityRadius: number;
}

export interface TreasureHunt {
  id: string;
  name: string;
  description: string;
  locations: TreasureLocation[];
}

export interface GameState {
  huntId: string;
  currentLocationIndex: number;
  foundLocations: string[];
  startedAt: number;
  completedAt?: number;
}
