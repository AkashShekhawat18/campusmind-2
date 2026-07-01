'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useMalphorStore, MalphorBaseState, GestureType } from '@/hooks/useMalphorStore';

// ── Per-state configuration tables ──────────────────────────
interface StateVisuals {
  floatSpeed: number;
  floatIntensity: number;
  rotationIntensity: number;
  sparklesCount: number;
  sparklesSpeed: number;
  sparklesOpacity: number;
  emissiveBoost: number; // 0–1, pulsing multiplier
}

const STATE_VISUALS: Record<MalphorBaseState, StateVisuals> = {
  idle: {
    floatSpeed: 2,
    floatIntensity: 1.2,
    rotationIntensity: 0.4,
    sparklesCount: 20,
    sparklesSpeed: 0.3,
    sparklesOpacity: 0.5,
    emissiveBoost: 0,
  },
  walking: {
    floatSpeed: 3.5,
    floatIntensity: 0.5,
    rotationIntensity: 0.2,
    sparklesCount: 15,
    sparklesSpeed: 0.5,
    sparklesOpacity: 0.4,
    emissiveBoost: 0,
  },
  thinking: {
    floatSpeed: 1,
    floatIntensity: 0.3,
    rotationIntensity: 0.1,
    sparklesCount: 80,
    sparklesSpeed: 0.8,
    sparklesOpacity: 0.9,
    emissiveBoost: 0.4,
  },
  talking: {
    floatSpeed: 2.5,
    floatIntensity: 0.8,
    rotationIntensity: 0.3,
    sparklesCount: 40,
    sparklesSpeed: 0.5,
    sparklesOpacity: 0.6,
    emissiveBoost: 0.2,
  },
  sleep: {
    floatSpeed: 0.5,
    floatIntensity: 0.15,
    rotationIntensity: 0.05,
    sparklesCount: 5,
    sparklesSpeed: 0.1,
    sparklesOpacity: 0.2,
    emissiveBoost: 0,
  },
};

// Gesture duration in ms
const GESTURE_DURATION = 500;

// Bell curve for gesture easing: peaks at 0.5, zero at 0 and 1
function bellCurve(t: number): number {
  return Math.sin(t * Math.PI);
}

// ── Props ────────────────────────────────────────────────────
interface Malphor3DProps {
  cursorPos: { x: number; y: number; distance: number };
}

export function Malphor3D({ cursorPos }: Malphor3DProps) {
  const { scene } = useGLTF('/models/malphor.glb');

  const modelRef = useRef<THREE.Group>(null);
  const containerRef = useRef<THREE.Group>(null);

  // Smoothed current values (lerp targets → current every frame)
  const smoothed = useRef({
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    posY: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    containerScale: 1,
    containerY: 0,
  });

  const timeRef = useRef(0);

  // Memoize the scene clone so React strict-mode re-renders don't break it
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Apply emissive boost to materials when state changes
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  useMemo(() => {
    const mats: THREE.MeshStandardMaterial[] = [];
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mesh.material = mat;
          mats.push(mat);
        }
      }
    });
    materialsRef.current = mats;
  }, [clonedScene]);

  // ── useFrame: the animation pipeline ────────────────────
  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (!modelRef.current || !containerRef.current) return;

    // Read store (non-reactive — we read every frame anyway)
    const storeState = useMalphorStore.getState();
    const baseState = storeState.baseState;
    const gesture = storeState.gesture;
    const gestureStartTime = storeState.gestureStartTime;
    const talkingIntensity = storeState.talkingIntensity;
    const chatOpen = storeState.chatOpen;
    const s = smoothed.current;

    // ┌─────────────────────────────────────────────────────┐
    // │ 1. Container-level: sleep droop                     │
    // └─────────────────────────────────────────────────────┘
    const targetContainerScale = 1;
    let targetContainerY = 0;

    if (baseState === 'sleep') {
      targetContainerY = -0.3;
    }

    s.containerScale = THREE.MathUtils.lerp(s.containerScale, targetContainerScale, 0.08);
    s.containerY = THREE.MathUtils.lerp(s.containerY, targetContainerY, 0.05);

    containerRef.current.scale.setScalar(s.containerScale);
    containerRef.current.position.y = s.containerY;

    // ┌─────────────────────────────────────────────────────┐
    // │ 2. Base state motion targets                        │
    // └─────────────────────────────────────────────────────┘
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;
    let targetPosY = 0;
    let targetScaleY = 1;

    switch (baseState) {
      case 'idle':
        targetPosY = Math.sin(t * 2) * 0.05;
        break;

      case 'walking':
        // Subtle forward lean + faster bob + Y-rotation swagger
        targetPosY = Math.sin(t * 8) * 0.08;
        targetRotZ = Math.sin(t * 6) * 0.06; // lean side-to-side
        targetRotY += Math.sin(t * 4) * 0.12; // swagger
        targetRotX = -0.08; // slight forward lean
        break;

      case 'thinking':
        // Near-still, "concentrating"
        targetPosY = Math.sin(t * 0.8) * 0.02;
        targetRotX = -0.05; // slight downward look
        break;

      case 'talking': {
        // Glow-breathing scale pulse + rhythmic nod
        const intensity = talkingIntensity;
        targetPosY = Math.sin(t * 3) * 0.04;
        targetScaleY = 1 + Math.sin(t * 12) * 0.015 * intensity;
        targetRotX = Math.sin(t * 6) * 0.04 * intensity; // nod
        break;
      }

      case 'sleep':
        targetRotX = 0.35; // head drooped down
        targetPosY = Math.sin(t * 0.5) * 0.01; // barely breathing
        break;
    }

    // ┌─────────────────────────────────────────────────────┐
    // │ 3. Gesture overlay (additive)                       │
    // └─────────────────────────────────────────────────────┘
    if (gesture) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = now - gestureStartTime;
      const progress = Math.min(elapsed / GESTURE_DURATION, 1);
      const amount = bellCurve(progress);

      switch (gesture) {
        case 'hop':
          targetPosY += amount * 0.3;
          break;
        case 'flick':
          targetRotY += amount * 0.5;
          break;
        case 'stretch':
          targetScaleY += amount * 0.15;
          break;
        case 'nod':
          targetRotX += amount * 0.2;
          break;
      }

      // Auto-clear gesture when done
      if (progress >= 1) {
        useMalphorStore.getState().clearGesture();
      }
    }

    // ┌─────────────────────────────────────────────────────┐
    // │ 4. Cursor / Chat tracking (layered underneath)      │
    // └─────────────────────────────────────────────────────┘
    if (chatOpen) {
      // Chat override: look at chat interface
      if (baseState === 'talking') {
        // Looking at the message area (mid-left)
        targetRotY += 0.3;
        targetRotX += 0.05;
      } else {
        // Looking at the input box (bottom-left)
        targetRotY += 0.4;
        targetRotX -= 0.15;
      }
    } else if (baseState !== 'sleep') {
      // Normal cursor tracking
      let trackWeight = 1.0;
      if (baseState === 'thinking') trackWeight = 0.2;
      else if (baseState === 'walking') trackWeight = 0.5;

      if (cursorPos.distance < 400) {
        targetRotX += cursorPos.y * 0.3 * trackWeight;
        targetRotY += cursorPos.x * 0.5 * trackWeight;
      }
    }

    // ┌─────────────────────────────────────────────────────┐
    // │ 5. Lerp current → target (smooth transitions)       │
    // └─────────────────────────────────────────────────────┘
    const lerpSpeed = 0.08;
    s.rotX = THREE.MathUtils.lerp(s.rotX, targetRotX, lerpSpeed);
    s.rotY = THREE.MathUtils.lerp(s.rotY, targetRotY, lerpSpeed);
    s.rotZ = THREE.MathUtils.lerp(s.rotZ, targetRotZ, lerpSpeed);
    s.posY = THREE.MathUtils.lerp(s.posY, targetPosY, lerpSpeed);
    s.scaleY = THREE.MathUtils.lerp(s.scaleY, targetScaleY, lerpSpeed);

    // ┌─────────────────────────────────────────────────────┐
    // │ 6. Apply to modelRef                                │
    // └─────────────────────────────────────────────────────┘
    modelRef.current.rotation.x = -s.rotX;
    modelRef.current.rotation.y = s.rotY;
    modelRef.current.rotation.z = s.rotZ;
    modelRef.current.position.y = s.posY;
    modelRef.current.scale.set(1, s.scaleY, 1);

  });

  // ── Read visuals for declarative props (re-renders on state change) ──
  const baseState = useMalphorStore((s) => s.baseState);
  const visuals = STATE_VISUALS[baseState];

  return (
    <group ref={containerRef} dispose={null}>
      <Float
        speed={visuals.floatSpeed}
        rotationIntensity={visuals.rotationIntensity}
        floatIntensity={visuals.floatIntensity}
        floatingRange={[-0.1, 0.1]}
      >
        <group ref={modelRef}>
          {/* Main 3D Model */}
          <primitive object={clonedScene} scale={3.2} position={[0, -0.4, 0]} rotation={[0, Math.PI, 0]} />

          {/* Sparkles — always present, intensity varies by state */}
          <Sparkles
            count={visuals.sparklesCount}
            scale={3}
            size={6}
            speed={visuals.sparklesSpeed}
            opacity={visuals.sparklesOpacity}
            color="#00e5ff"
          />

          {/* Thinking: extra slow-rotating glow ring */}
          {baseState === 'thinking' && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.5, 0.02, 16, 64]} />
              <meshBasicMaterial color="#00e5ff" transparent opacity={0.4} />
            </mesh>
          )}
        </group>
      </Float>
    </group>
  );
}

useGLTF.preload('/models/malphor.glb');
