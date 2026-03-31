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
  coordinates: string;
  // coordinates: Coordinates;
  clue: string;
  clueHidden: string;
  // imageUrl: string;
  // suggested street view camera angle for viewing the treasure
  // streetViewPov: StreetViewPov;
  // how close (meters) the player must be in street view to see the marker
  // proximityRadius: number;
  // congratsMessage: string;
  name: string;
}

export interface TreasureHunt {
  id: string;
  name: string;
  description: string;
  locations: TreasureLocation[];
  imageUrl: string;
  streetViewPov: StreetViewPov;
  proximityRadius: number;
}

export interface GameState {
  huntId: string;
  currentLocationIndex: number;
  foundLocations: string[];
  startedAt: number;
  completedAt?: number;
}
