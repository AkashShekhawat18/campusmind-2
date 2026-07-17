import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Moon } from 'lucide-react';

export const AnimatedSun = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    className="flex items-center justify-center"
  >
    <Sun className={className} />
  </motion.div>
);

export const AnimatedMoon = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ rotate: [-5, 5, -5] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="flex items-center justify-center"
  >
    <Moon className={className} />
  </motion.div>
);

export const AnimatedCloud = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ x: [-2, 2, -2], y: [0, -1, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="flex items-center justify-center"
  >
    <Cloud className={className} />
  </motion.div>
);

export const AnimatedRain = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ y: [0, 2, 0] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    className="flex items-center justify-center"
  >
    <CloudRain className={className} />
  </motion.div>
);

export const AnimatedSnow = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ rotate: [-10, 10, -10], y: [0, 2, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    className="flex items-center justify-center"
  >
    <Snowflake className={className} />
  </motion.div>
);

export const AnimatedStorm = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
    className="flex items-center justify-center"
  >
    <CloudLightning className={className} />
  </motion.div>
);

export const AnimatedFog = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ x: [-3, 3, -3], opacity: [0.8, 1, 0.8] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    className="flex items-center justify-center"
  >
    <CloudFog className={className} />
  </motion.div>
);

export const getWeatherIcon = (code: number, isDay: boolean, className: string = "") => {
  if (code === 0) return isDay ? <AnimatedSun className={className} /> : <AnimatedMoon className={className} />;
  if ([1, 2].includes(code)) return isDay ? <AnimatedCloud className={className} /> : <AnimatedMoon className={className} />;
  if (code === 3) return <AnimatedCloud className={className} />;
  if ([45, 48].includes(code)) return <AnimatedFog className={className} />;
  if ([51, 53, 55, 56, 57].includes(code)) return <AnimatedRain className={className} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <AnimatedRain className={className} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <AnimatedSnow className={className} />;
  if ([95, 96, 99].includes(code)) return <AnimatedStorm className={className} />;
  return <AnimatedCloud className={className} />;
};

export const getWeatherDescription = (code: number): string => {
  if (code === 0) return 'Clear';
  if ([1, 2].includes(code)) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Unknown';
};

export const getWeatherThemeColor = (code: number, isDay: boolean): { bg: string, border: string, text: string } => {
  if (!isDay) return { bg: 'bg-indigo-950/40', border: 'border-indigo-500/20', text: 'text-indigo-200' };
  
  if (code === 0 || code === 1) return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' }; // Sunny
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' }; // Rain
  if ([95, 96, 99].includes(code)) return { bg: 'bg-purple-900/30', border: 'border-purple-500/30', text: 'text-purple-400' }; // Storm
  
  return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-300' }; // Default / Cloudy
};
