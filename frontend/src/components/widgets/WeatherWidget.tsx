'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { 
  MapPin, Loader2, AlertCircle, Search, Star, Clock, X, ChevronRight,
  Thermometer, Droplets, Wind, Eye
} from 'lucide-react';
import { WeatherData, LocationSearchResult } from './weather/types';
import { 
  fetchWeather, fetchIpLocation, reverseGeocode, searchCities, getCachedWeather, setCachedWeather,
  CACHE_DURATION, getSavedLocations, saveLocation, removeFavorite 
} from './weather/WeatherService';
import { getWeatherIcon, getWeatherDescription, getWeatherThemeColor } from './weather/AnimatedIcons';

export const WeatherWidget = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Popup & Search state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [recentLocations, setRecentLocations] = useState<LocationSearchResult[]>([]);
  const [favorites, setFavorites] = useState<LocationSearchResult[]>([]);

  const popupRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Load saved locations
    setRecentLocations(getSavedLocations('recent'));
    setFavorites(getSavedLocations('favorites'));

    loadWeather();
    
    // Auto refresh every 5 mins
    const interval = setInterval(loadWeather, CACHE_DURATION);
    
    // Click outside listener
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadWeather = async (forceLocation?: LocationSearchResult) => {
    setLoading(true);
    try {
      if (forceLocation) {
        await fetchAndSetWeather(forceLocation.latitude, forceLocation.longitude, forceLocation.name);
        return;
      }

      const cached = getCachedWeather();
      // If cached data exists but city is incorrectly labeled, bypass cache to re-detect
      if (cached && cached.city !== 'Neem ka Thana' && cached.city !== 'Surajgarh') {
        setData(cached);
        setLoading(false);
        return;
      }

      // Default logic: Geo -> IP -> Default (Pilani)
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            let city = 'Pilani';
            try {
              const reverseCity = await reverseGeocode(position.coords.latitude, position.coords.longitude);
              if (reverseCity && reverseCity !== 'Neem ka Thana' && reverseCity !== 'Surajgarh') {
                city = reverseCity;
              } else {
                const ipInfo = await fetchIpLocation();
                if (ipInfo && ipInfo.city && ipInfo.city !== 'Neem ka Thana' && ipInfo.city !== 'Surajgarh') city = ipInfo.city;
              }
            } catch (e) {}
            await fetchAndSetWeather(position.coords.latitude, position.coords.longitude, city);
          },
          async () => {
            await loadFallbackIp();
          },
          { timeout: 5000 }
        );
      } else {
        await loadFallbackIp();
      }
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  const loadFallbackIp = async () => {
    const ipInfo = await fetchIpLocation();
    if (ipInfo && ipInfo.latitude && ipInfo.longitude) {
      const reverseCity = await reverseGeocode(ipInfo.latitude, ipInfo.longitude);
      const isValidCity = (c?: string | null) => c && c !== 'Neem ka Thana' && c !== 'Surajgarh';
      const city = isValidCity(reverseCity) ? reverseCity as string : (isValidCity(ipInfo.city) ? ipInfo.city as string : 'Pilani');
      await fetchAndSetWeather(ipInfo.latitude, ipInfo.longitude, city);
    } else {
      // Ultimate fallback: Pilani (28.36, 75.58)
      await fetchAndSetWeather(28.36, 75.58, 'Pilani');
    }
  };

  const fetchAndSetWeather = async (lat: number, lon: number, city: string) => {
    const weather = await fetchWeather(lat, lon, city);
    if (weather) {
      setData(weather);
      setCachedWeather(weather);
      setError(false);
    } else {
      setError(true);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchCities(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const selectLocation = async (loc: LocationSearchResult) => {
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    
    saveLocation('recent', loc);
    setRecentLocations(getSavedLocations('recent'));
    
    await loadWeather(loc);
  };

  const toggleFavorite = (e: React.MouseEvent, loc: LocationSearchResult) => {
    e.stopPropagation();
    if (favorites.find(f => f.id === loc.id)) {
      removeFavorite(loc.id);
    } else {
      saveLocation('favorites', loc);
    }
    setFavorites(getSavedLocations('favorites'));
  };

  if (!mounted) return null;

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md bg-white/5 border-white/10">
        <Loader2 size={14} className="animate-spin opacity-50" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md bg-red-500/10 border-red-500/20 text-red-400">
        <AlertCircle size={14} />
        <span className="text-[11px] font-medium">Weather unavailable</span>
      </div>
    );
  }

  const themeStyle = data ? getWeatherThemeColor(data.conditionCode, data.isDay) : { bg: '', border: '', text: '' };
  const desc = data ? getWeatherDescription(data.conditionCode) : '';

  return (
    <div className="relative z-[99999]" ref={popupRef}>
      {/* Widget Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 ${themeStyle.bg} ${themeStyle.border} ${themeStyle.text} hover:opacity-80`}
      >
        <div className="flex items-center gap-1 opacity-80">
          <MapPin size={12} />
          <span className="text-[11px] font-medium mr-1 truncate max-w-[80px]">{data?.city}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {data && getWeatherIcon(data.conditionCode, data.isDay, "w-4 h-4")}
          <span className="text-xs font-semibold">{data?.temp}°C</span>
        </div>
      </button>

      {/* Popup */}
      <AnimatePresence>
        {isOpen && data && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full right-0 mt-3 w-80 rounded-2xl border shadow-2xl overflow-hidden z-[99999] ${
              isDark ? 'bg-[#18181b] text-white border-white/15 shadow-black/90' : 'bg-white text-slate-900 border-slate-200 shadow-2xl'
            }`}
          >
            {/* Header / Current Weather Display */}
            <div className={`p-4 ${isDark ? 'bg-[#222226]' : 'bg-slate-50'} ${themeStyle.bg}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg truncate">{data.city}</h3>
                  <p className="text-xs opacity-70 flex items-center gap-1">
                    <Clock size={10} /> Updated {new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-2xl font-bold">{data.temp}°C</span>
                    {getWeatherIcon(data.conditionCode, data.isDay, "w-6 h-6")}
                  </div>
                  <p className="text-xs font-medium opacity-80">{desc}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-current/10 text-xs">
                <div className="text-center">
                  <Thermometer size={14} className="mx-auto mb-1 opacity-70" />
                  <span className="font-semibold block">{data.feelsLike}°</span>
                </div>
                <div className="text-center">
                  <Droplets size={14} className="mx-auto mb-1 opacity-70" />
                  <span className="font-semibold block">{data.humidity}%</span>
                </div>
                <div className="text-center">
                  <Wind size={14} className="mx-auto mb-1 opacity-70" />
                  <span className="font-semibold block">{data.windSpeed}</span>
                </div>
                <div className="text-center">
                  <Eye size={14} className="mx-auto mb-1 opacity-70" />
                  <span className="font-semibold block">{data.visibility}km</span>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className={`p-3 border-b relative ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-slate-200'}`}>
              <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-50" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search city..." 
                value={searchQuery}
                onChange={handleSearch}
                className={`w-full rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                  isDark ? 'bg-white/10 text-white placeholder-white/40' : 'bg-slate-100 text-slate-900 placeholder-slate-400'
                }`}
              />
              {isSearching && <Loader2 size={12} className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin opacity-50" />}
            </div>

            {/* Lists Container */}
            <div className={`max-h-[250px] overflow-y-auto p-2 scrollbar-thin ${isDark ? 'bg-[#18181b]' : 'bg-white'}`}>
              {searchQuery.length > 0 ? (
                // Search Results
                <div className="space-y-1">
                  {searchResults.length === 0 && !isSearching && (
                    <div className="text-center py-4 text-xs opacity-50">No locations found.</div>
                  )}
                  {searchResults.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => selectLocation(loc)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium text-sm">{loc.name}</div>
                        <div className="text-xs opacity-60">{loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}</div>
                      </div>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                // Favourites & Recents
                <div className="space-y-4 py-2">
                  {favorites.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-3 mb-1 flex items-center gap-1">
                        <Star size={10} /> Favorites
                      </h4>
                      {favorites.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => selectLocation(loc)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors flex justify-between items-center group"
                        >
                          <span className="text-sm font-medium">{loc.name}</span>
                          <div 
                            role="button" 
                            onClick={(e) => toggleFavorite(e, loc)}
                            className="p-1 rounded-full hover:bg-foreground/10 opacity-50 hover:opacity-100 text-yellow-500"
                          >
                            <Star size={12} className="fill-current" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {recentLocations.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-50 px-3 mb-1 flex items-center gap-1">
                        <Clock size={10} /> Recent
                      </h4>
                      {recentLocations.map((loc) => {
                        const isFav = favorites.find(f => f.id === loc.id);
                        return (
                          <button
                            key={loc.id}
                            onClick={() => selectLocation(loc)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors flex justify-between items-center group"
                          >
                            <span className="text-sm font-medium">{loc.name}</span>
                            <div 
                              role="button" 
                              onClick={(e) => toggleFavorite(e, loc)}
                              className={`p-1 rounded-full hover:bg-foreground/10 opacity-50 hover:opacity-100 transition-colors ${isFav ? 'text-yellow-500' : ''}`}
                            >
                              <Star size={12} className={isFav ? "fill-current" : ""} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {favorites.length === 0 && recentLocations.length === 0 && (
                    <div className="text-center py-4 text-xs space-y-2">
                      <p className="opacity-50">Search for a city or pick below:</p>
                      <button
                        onClick={() => selectLocation({ id: 1259693, name: 'Pilani', latitude: 28.36, longitude: 75.58, country: 'India', admin1: 'Rajasthan' })}
                        className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                      >
                        📍 Select Pilani, Rajasthan
                      </button>
                    </div>
                  )}
                  <div className="pt-2 border-t border-foreground/5 text-center">
                    <button
                      onClick={() => {
                        localStorage.removeItem('malphor_weather_cache');
                        loadWeather();
                      }}
                      className="text-[11px] text-primary/80 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto py-1"
                    >
                      <MapPin size={10} /> Auto-detect My Location
                    </button>
                  </div>
                </div>
              )}
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
