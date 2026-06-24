'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InteractiveCard({ children, className = '', onClick }: InteractiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Heavier, smoother spring for premium feel
  const mouseXSpring = useSpring(x, { stiffness: 80, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 80, damping: 20 });

  // Subtle tilt
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const spotX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const spotY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${spotX} ${spotY}, rgba(255,255,255,0.08), transparent 50%)`;

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-2xl cursor-pointer ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Layer 1: Background Glass */}
      <div 
        className="absolute inset-0 rounded-2xl overflow-hidden glass-panel"
        style={{ transform: "translateZ(0px)" }}
      >
        {/* Layer 4: Interactive Light Glare overlay inside the glass */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 z-10 transition-opacity duration-300 pointer-events-none"
            style={{ background: glareBackground }}
          />
        )}
      </div>
      
      {/* Layer 2 & 3: Content pushed out via translateZ */}
      <div 
        className="w-full h-full relative z-20 rounded-2xl p-10 flex flex-col"
        style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </motion.div>
  );
}
