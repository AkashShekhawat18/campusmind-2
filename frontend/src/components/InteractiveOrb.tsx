'use client';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

function RobotMesh() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Follow mouse pointer slightly
    const targetX = (state.pointer.y * Math.PI) / 8;
    const targetY = (state.pointer.x * Math.PI) / 4;
    
    // Smoothly interpolate to target rotation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.1);
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
      <group ref={groupRef} scale={0.7}>
        {/* Head */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.4, 1.1, 1.2]} />
          <meshStandardMaterial color="#0070F3" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Eyes (Glowing) */}
        <mesh position={[-0.3, 0.8, 0.61]}>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
        <mesh position={[0.3, 0.8, 0.61]}>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>

        {/* Antenna Base & Stem */}
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Antenna Glowing Tip */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
        
        {/* Body */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.8]} />
          <meshStandardMaterial color="#0050B3" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Floating Hands */}
        <mesh position={[-0.8, -0.2, 0.2]}>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshStandardMaterial color="#0070F3" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.8, -0.2, 0.2]}>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshStandardMaterial color="#0070F3" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

export function InteractiveOrb() {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 6] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#00E5FF" />
        <RobotMesh />
      </Canvas>
    </div>
  );
}
