'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';

function KnowledgeSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();
  
  const [sphereData, setSphereData] = useState<Float32Array | null>(null);

  useEffect(() => {
    const points = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
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
          color="#3a3a3c" 
          wireframe 
          transparent 
          opacity={0.3} 
        />
      </mesh>
      
      {sphereData && (
        <Points ref={pointsRef} positions={sphereData} stride={3} frustumCulled={false}>
          <PointMaterial transparent color="#ffffff" size={0.015} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
        </Points>
      )}
    </group>
  );
}

function CursorLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { mouse, viewport } = useThree();

  useFrame(() => {
    if (lightRef.current) {
      const x = (mouse.x * viewport.width) / 2;
      const y = (mouse.y * viewport.height) / 2;
      lightRef.current.position.set(x, y, 2);
    }
  });

  return <pointLight ref={lightRef} intensity={3} color="#ffffff" distance={15} />;
}

export function BackgroundScene() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-graphite">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#a1a1aa" />
        <CursorLight />
        <Stars radius={100} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <KnowledgeSphere />
        </Float>
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#0a0a0c_80%)]" />
    </div>
  );
}
