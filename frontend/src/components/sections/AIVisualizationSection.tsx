'use client';
import { useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import { CanvasErrorBoundary } from '@/components/ui/CanvasErrorBoundary';

function AIBlob() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
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

export function AIVisualizationSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 z-20 overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <CanvasErrorBoundary>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <AIBlob />
          </Canvas>
        </CanvasErrorBoundary>
      </div>
      
      <div className="relative z-10 text-center pointer-events-none">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight drop-shadow-2xl"
        >
          Intelligence at the Core.
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl text-electric font-bold max-w-2xl mx-auto backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-foreground/10"
        >
          Adaptive machine learning models generate curriculum, analyze student paths, and predict institutional trends in real-time.
        </motion.p>
      </div>
    </section>
  );
}
