export interface WeatherData {
  city: string;
  lat: number;
  lon: number;
  temp: number;
  conditionCode: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  visibility: number; // in km
  timestamp: number;
  isDay: boolean;
  pressure: number; // hPa
}

export interface LocationSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State / Province
}

export interface SavedLocation {
  id: string; // Unique ID (e.g. lat,lon or name)
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}
