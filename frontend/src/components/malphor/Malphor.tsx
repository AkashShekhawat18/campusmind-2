'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Environment } from '@react-three/drei';
import { useSafeZones } from '@/hooks/useSafeZones';
import { useWaypointMovement, WaypointName } from '@/hooks/useWaypointMovement';
import { useMalphorBehavior } from '@/hooks/useMalphorBehavior';
import { useMalphorStore } from '@/hooks/useMalphorStore';
import { MalphorChat } from './MalphorChat';
import { Malphor3D } from './Malphor3D';
import { MalphorBubble } from './MalphorBubble';

export function Malphor() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store
  const setBaseState = useMalphorStore((s) => s.setBaseState);
  const chatOpen = useMalphorStore((s) => s.chatOpen);
  const setChatOpen = useMalphorStore((s) => s.setChatOpen);
  const fireGesture = useMalphorStore((s) => s.fireGesture);

  // 1. Collision avoidance zones
  const safeZones = useSafeZones();

  // 2. Waypoint movement for gliding along the right side
  const { currentWaypoint, offset, moveToWaypoint } = useWaypointMovement(safeZones, 180);

  // 3. Complex behavioral state machine (handles entry, hover, clicks)
  const {
    bubbleText,
    bubbleVisible,
    cursorPos,
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

  // ── Handlers ───────────────────────────────────────────
  const handleToggleChat = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-chat-trigger')) return;

    handleMascotClick(); // Registers the easter egg clicks

    if (!chatOpen) {
      setChatOpen(true);
      fireGesture('nod');
      showBubble('Opening support console... 🚀', 2000);
    }
  };

  return (
    <>
      <motion.div
        ref={containerRef}
        animate={{
          x: offset.x,
          y: offset.y,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 15, mass: 1 }}
        onClick={handleToggleChat}
        className="fixed bottom-6 right-6 z-40 w-[180px] h-[220px] cursor-pointer select-none group focus:outline-none"
      >
        {/* Speech bubble — rendered in DOM layer above 3D canvas */}
        <div className="absolute bottom-[140px] right-[140px] w-[250px] pointer-events-none z-50">
          <MalphorBubble text={bubbleText} visible={bubbleVisible} />
        </div>

        <div className="w-full h-full pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 7], fov: 40 }}
            style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" castShadow />
            <pointLight position={[-5, -5, -5]} intensity={1.5} color="#00e5ff" />
            <Environment preset="city" />

            <Malphor3D cursorPos={cursorPos} />
          </Canvas>
        </div>
      </motion.div>

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
