'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Environment } from '@react-three/drei';
import { useSafeZones } from '@/hooks/useSafeZones';
import { useWaypointMovement, WaypointName } from '@/hooks/useWaypointMovement';
import { useMalphorBehavior } from '@/hooks/useMalphorBehavior';
import { useMalphorStore } from '@/hooks/useMalphorStore';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { MalphorChat } from './MalphorChat';
import { Malphor3D } from './Malphor3D';
import { MalphorBubble } from './MalphorBubble';
import { CanvasErrorBoundary } from '@/components/ui/CanvasErrorBoundary';

export function Malphor() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const isDashboardMode = pathname?.startsWith('/student/dashboard') || pathname?.startsWith('/teacher/dashboard') || pathname?.startsWith('/admin/dashboard');

  // Store
  const setBaseState = useMalphorStore((s) => s.setBaseState);
  const chatOpen = useMalphorStore((s) => s.chatOpen);
  const setChatOpen = useMalphorStore((s) => s.setChatOpen);
  const fireGesture = useMalphorStore((s) => s.fireGesture);

  // 1. Collision avoidance zones
  const safeZones = useSafeZones();

  // 2. Waypoint movement for gliding along the right side
  const { currentWaypoint, offset, moveToWaypoint } = useWaypointMovement(safeZones, 140);

  // 3. Complex behavioral state machine (handles entry, hover, clicks)
  const {
    bubbleText,
    bubbleVisible,
    cursorPosRef,
    showBubble,
    handleMascotClick,
  } = useMalphorBehavior(containerRef, currentWaypoint.name, moveToWaypoint);

  // ── Chat Override ────────────────────────────────────────
  useEffect(() => {
    if (chatOpen) {
      moveToWaypoint('chat');
    } else {
      moveToWaypoint('hero'); // Default home position
    }
  }, [chatOpen, moveToWaypoint]);
  
  const showCollapsedLogo = isDashboardMode && !chatOpen;

  // ── Handlers ───────────────────────────────────────────
  const handleToggleChat = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-chat-trigger')) return;

    handleMascotClick(); // Registers the easter egg clicks

    if (!chatOpen) {
      setChatOpen(true);
      fireGesture('nod');
      showBubble('Opening support console... 🚀', 2000);
    } else {
      setChatOpen(false);
    }
  };

  return (
    <>
      {showCollapsedLogo ? (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setChatOpen(true);
            fireGesture('nod');
            showBubble('Opening support console... 🚀', 2000);
          }}
          className={`fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center overflow-hidden transition-all cursor-pointer ${
            mounted && resolvedTheme === 'light' 
              ? 'bg-white/60 backdrop-blur-xl border border-black/10 shadow-lg hover:shadow-xl'
              : 'glass-panel shadow-[0_0_15px_rgba(0,229,255,0.4)] border border-cyan-500/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] bg-black/40 backdrop-blur-md'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={mounted && resolvedTheme === 'light' ? '/malphor-logo-light.png' : '/malphor-logo.png'} 
            alt="Malphor Logo" 
            className={`object-contain drop-shadow-md ${
              mounted && resolvedTheme === 'light' 
                ? 'w-[85%] h-[85%] invert opacity-80' 
                : 'w-14 h-14'
            }`} 
          />
        </motion.button>
      ) : (
        <motion.div
          ref={containerRef}
          animate={{
            x: offset.x,
            y: offset.y,
          }}
          transition={{ type: 'spring', stiffness: 50, damping: 15, mass: 1 }}
          onClick={handleToggleChat}
          className="fixed bottom-6 right-6 z-40 w-[180px] h-[230px] cursor-pointer select-none group focus:outline-none"
        >
          {/* Speech bubble — rendered in DOM layer above 3D canvas */}
          <div className="absolute bottom-[130px] right-[150px] w-[250px] pointer-events-none z-50">
            <MalphorBubble text={bubbleText} visible={bubbleVisible} />
          </div>

          <div className="w-full h-full pointer-events-none">
            <CanvasErrorBoundary>
              <Canvas
                camera={{ position: [0, 0, 7], fov: 40 }}
                style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
                gl={{ alpha: true, antialias: true }}
              >
                <ambientLight intensity={1.2} />
                <directionalLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" castShadow />
                <pointLight position={[-5, -5, -5]} intensity={1.5} color="#00e5ff" />
                <Environment preset="city" />

                <Malphor3D cursorPosRef={cursorPosRef} />
              </Canvas>
            </CanvasErrorBoundary>
          </div>
        </motion.div>
      )}

      <MalphorChat
        isOpen={chatOpen}
        onClose={() => {
          setChatOpen(false);
          // After closing, he will naturally slide back to the active section via the scroll listener
        }}
        onBotSpeak={(text) => showBubble(text, 4500)}
      />
    </>
  );
}
