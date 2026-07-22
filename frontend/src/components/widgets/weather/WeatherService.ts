import { WeatherData, LocationSearchResult } from './types';

const CACHE_KEY = 'campusmind_weather_cache';
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchIpLocation = async () => {
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.locality || data.city || data.principalSubdivision || null;
  } catch (err) {
    return null;
  }
};

export const fetchWeather = async (lat: number, lon: number, city: string): Promise<WeatherData | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure,visibility`;
    const res = await fetch(url).catch(() => null);
    
    if (!res || !res.ok) return null;
    
    const data = await res.json();
    const current = data.current;

    return {
      city,
      lat,
      lon,
      temp: Math.round(current.temperature_2m),
      conditionCode: current.weather_code,
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      visibility: Math.round(current.visibility / 1000), // convert to km
      pressure: Math.round(current.surface_pressure),
      isDay: current.is_day === 1,
      timestamp: Date.now()
    };
  } catch (err) {
    return null;
  }
};

export const searchCities = async (query: string): Promise<LocationSearchResult[]> => {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    return [];
  }
};

export const getCachedWeather = (): WeatherData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as WeatherData;
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore parse error
  }
  return null;
};

export const setCachedWeather = (weather: WeatherData) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(weather));
};

export const getSavedLocations = (key: 'recent' | 'favorites'): LocationSearchResult[] => {
  try {
    const data = localStorage.getItem(`campusmind_weather_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocation = (key: 'recent' | 'favorites', location: LocationSearchResult) => {
  try {
    let current = getSavedLocations(key);
    // Remove if exists
    current = current.filter(loc => loc.id !== location.id);
    // Add to top
    current.unshift(location);
    if (key === 'recent') {
      current = current.slice(0, 5); // Keep only last 5 for recent
    }
    localStorage.setItem(`campusmind_weather_${key}`, JSON.stringify(current));
  } catch (e) {
    console.error(`Failed to save ${key} location`, e);
  }
};

export const removeFavorite = (id: number) => {
  try {
    let current = getSavedLocations('favorites');
    current = current.filter(loc => loc.id !== id);
    localStorage.setItem(`campusmind_weather_favorites`, JSON.stringify(current));
  } catch(e) {}
}
