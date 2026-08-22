'use client';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { CanvasErrorBoundary } from '@/components/ui/CanvasErrorBoundary';

function OrbMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Original animation combined with mouse pointer follow
    const targetX = state.clock.getElapsedTime() * 0.2 - (state.pointer.y * Math.PI) / 4;
    const targetY = state.clock.getElapsedTime() * 0.3 + (state.pointer.x * Math.PI) / 4;
    
    // Smoothly interpolate to target rotation
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.1);
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 20]} />
        <MeshDistortMaterial 
          color="#0070F3" 
          emissive="#0070F3"
          emissiveIntensity={0.5}
          wireframe={true}
          distort={0.4} 
          speed={2} 
        />
      </mesh>
    </Float>
  );
}

export function InteractiveOrb() {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center pointer-events-auto">
      <CanvasErrorBoundary>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <OrbMesh />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
