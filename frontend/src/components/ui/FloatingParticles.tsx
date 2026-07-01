'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function FloatingParticles() {
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, size: number, duration: number, delay: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 5
    }));
    const timer = setTimeout(() => setParticles(newParticles), 0);
    return () => clearTimeout(timer);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-electric shadow-[0_0_10px_rgba(0,112,243,0.8)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ["0vh", "-100vh"],
            opacity: [0, 0.8, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay
          }}
        />
      ))}
    </div>
  );
}
