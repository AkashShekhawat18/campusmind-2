'use client';

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { 
  Sun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Wind, Droplets, MapPin, Loader2, AlertCircle, Eye, Thermometer
} from 'lucide-react';

interface WeatherData {
  city: string;
  temp: number;
  conditionCode: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  timestamp: number;
}

const CACHE_KEY = 'campusmind_weather_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const getWeatherDetails = (code: number) => {
  if (code === 0) return { label: 'Clear', icon: Sun };
  if ([1, 2].includes(code)) return { label: 'Partly Cloudy', icon: Cloud };
  if (code === 3) return { label: 'Overcast', icon: Cloud };
  if ([45, 48].includes(code)) return { label: 'Fog', icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: CloudRain };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: Snowflake };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: CloudLightning };
  return { label: 'Unknown', icon: Cloud };
};

const fetchIpLocation = async () => {
  try {
    const res = await fetch('https://ipwho.is/');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

const fetchWeather = async (lat: number, lon: number, city: string): Promise<WeatherData | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility`;
    const res = await fetch(url).catch(() => null);
    
    if (!res || !res.ok) return null;
    
    const data = await res.json();
    const current = data.current;

    return {
      city,
      temp: Math.round(current.temperature_2m),
      conditionCode: current.weather_code,
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      visibility: Math.round(current.visibility / 1000), // convert to km
      timestamp: Date.now()
    };
  } catch (err) {
    return null;
  }
};

const WeatherWidgetBase = () => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadWeather();
    
    // Auto refresh every 15 mins
    const interval = setInterval(loadWeather, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const loadWeather = async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as WeatherData;
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          setData(parsed);
          setLoading(false);
          return;
        }
      }

      const getLocationAndWeather = async (lat: number, lon: number, city: string) => {
        const weather = await fetchWeather(lat, lon, city);
        if (weather) {
          setData(weather);
          localStorage.setItem(CACHE_KEY, JSON.stringify(weather));
          setError(false);
        } else {
          setError(true);
        }
        setLoading(false);
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              let city = 'Local';
              try {
                const ipInfo = await fetchIpLocation();
                if (ipInfo && ipInfo.city) city = ipInfo.city;
              } catch (e) {
                // Ignore IP lookup failure, fallback to Local
              }
              await getLocationAndWeather(position.coords.latitude, position.coords.longitude, city);
            } catch (err) {
              console.error("Weather fetch error (coords):", err);
              setError(true);
              setLoading(false);
            }
          },
          async () => {
            try {
              const ipInfo = await fetchIpLocation();
              if (ipInfo && ipInfo.latitude && ipInfo.longitude) {
                await getLocationAndWeather(ipInfo.latitude, ipInfo.longitude, ipInfo.city || 'Unknown');
              } else {
                setError(true);
                setLoading(false);
              }
            } catch (err) {
              console.error("Weather fetch error (ip):", err);
              setError(true);
              setLoading(false);
            }
          },
          { timeout: 5000 }
        );
      } else {
        const ipInfo = await fetchIpLocation();
        if (ipInfo && ipInfo.latitude && ipInfo.longitude) {
          await getLocationAndWeather(ipInfo.latitude, ipInfo.longitude, ipInfo.city || 'Unknown');
        } else {
          setError(true);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError(true);
      setLoading(false);
    }
  };

  if (!mounted) return null;
  const isDark = resolvedTheme === 'dark';

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
      }`}>
        <Loader2 size={14} className="animate-spin opacity-50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${
        isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500'
      }`}>
        <AlertCircle size={14} />
        <span className="text-[11px] font-medium hidden sm:inline">Weather unavailable</span>
      </div>
    );
  }

  const { label, icon: WeatherIcon } = getWeatherDetails(data.conditionCode);

  return (
    <div 
      className="relative group z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 cursor-default ${
        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/10 hover:bg-black/10'
      }`}>
        <div className="flex items-center gap-1 hidden md:flex opacity-70">
          <MapPin size={12} />
          <span className="text-[11px] font-medium mr-1 truncate max-w-[80px]">{data.city}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <WeatherIcon size={14} className={isDark ? 'text-cyan-400' : 'text-blue-500'} />
          <span className="text-xs font-semibold">{data.temp}°C</span>
        </div>

        <span className="text-[11px] font-medium opacity-70 hidden sm:inline border-l pl-2 ml-1 border-current border-opacity-20">
          {label}
        </span>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full right-0 mt-2 p-4 w-48 rounded-xl border shadow-xl backdrop-blur-xl ${
              isDark ? 'bg-[#111113]/90 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 flex items-center gap-1"><Thermometer size={12}/> Feels Like</span>
                <span className="font-semibold">{data.feelsLike}°C</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 flex items-center gap-1"><Droplets size={12}/> Humidity</span>
                <span className="font-semibold">{data.humidity}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 flex items-center gap-1"><Wind size={12}/> Wind</span>
                <span className="font-semibold">{data.windSpeed} km/h</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-60 flex items-center gap-1"><Eye size={12}/> Visibility</span>
                <span className="font-semibold">{data.visibility} km</span>
              </div>
              <div className="pt-2 mt-2 border-t border-current border-opacity-10 text-[10px] opacity-40 text-center">
                Updated {new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WeatherWidget = memo(WeatherWidgetBase);
