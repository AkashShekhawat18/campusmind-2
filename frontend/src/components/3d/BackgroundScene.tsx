'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

function KnowledgeSphere({ isLightMode }: { isLightMode: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();
  
  const [sphereData, setSphereData] = useState<Float32Array | null>(null);

  useEffect(() => {
    const points = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 3 * Math.cbrt(Math.random());
      
      points[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      points[i * 3 + 2] = r * Math.cos(phi);
    }
    const timer = setTimeout(() => setSphereData(points), 0);
    return () => clearTimeout(timer);
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current && pointsRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
      meshRef.current.rotation.x += delta * 0.02;
      
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.02;

      const targetX = mouse.x * 0.5;
      const targetY = mouse.y * 0.5;
      
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.05;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.05;
      
      pointsRef.current.position.x += (targetX - pointsRef.current.position.x) * 0.05;
      pointsRef.current.position.y += (targetY - pointsRef.current.position.y) * 0.05;
    }
  });

  return (
    <group position={[0, 0, -4]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.5, 3]} />
        <meshStandardMaterial 
          color={isLightMode ? "#0070F3" : "#3a3a3c"} 
          wireframe 
          transparent 
          opacity={isLightMode ? 0.4 : 0.3} 
        />
      </mesh>
      
      {sphereData && (
        <Points ref={pointsRef} positions={sphereData} stride={3} frustumCulled={false}>
          <PointMaterial transparent color={isLightMode ? "#1a1a1c" : "#ffffff"} size={isLightMode ? 0.02 : 0.015} sizeAttenuation={true} depthWrite={false} opacity={isLightMode ? 0.7 : 0.4} />
        </Points>
      )}
    </group>
  );
}

function CursorLight({ isLightMode }: { isLightMode: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const { mouse, viewport } = useThree();

  useFrame(() => {
    if (lightRef.current) {
      const x = (mouse.x * viewport.width) / 2;
      const y = (mouse.y * viewport.height) / 2;
      lightRef.current.position.set(x, y, 2);
    }
  });

  return <pointLight ref={lightRef} intensity={isLightMode ? 4 : 3} color={isLightMode ? "#0070F3" : "#ffffff"} distance={isLightMode ? 20 : 15} />;
}

export function BackgroundScene() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLightMode = mounted && resolvedTheme === 'light';

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-background">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <ambientLight intensity={isLightMode ? 0.8 : 0.2} />
        <directionalLight position={[5, 5, 5]} intensity={isLightMode ? 1 : 0.5} color={isLightMode ? "#ffffff" : "#a1a1aa"} />
        <CursorLight isLightMode={isLightMode} />
        {!isLightMode && <Stars radius={100} depth={50} count={4000} factor={3} saturation={0} fade speed={0.5} />}
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <KnowledgeSphere isLightMode={isLightMode} />
        </Float>
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--background)_80%)]" />
    </div>
  );
}
