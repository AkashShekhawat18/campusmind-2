'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAudioManager } from '@/hooks/useAudioManager';
import { motion } from 'framer-motion';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { playAudio } = useAudioManager();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/10 py-4 shadow-2xl' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-cyan to-electric-violet flex items-center justify-center">
            <div className="w-4 h-4 bg-deep-space rounded-sm group-hover:scale-50 transition-transform duration-300" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Campus<span className="text-gradient">Mind</span>
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Home</Link>
          <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</Link>
          <Link href="#about" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">About</Link>
        </div>

        {/* Right CTA */}
        <div className="flex items-center">
          <Link href="/admin/login">
            <button onClick={() => playAudio('adminPortal')} className="relative overflow-hidden rounded-full px-6 py-2 bg-gradient-to-b from-[#2a2a2c] to-[#1a1a1c] border border-white/10 text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_4px_12px_rgba(0,0,0,0.5)] hover:from-[#3a3a3c] hover:to-[#2a2a2c] hover:border-white/20 transition-all cursor-pointer">
              Admin Portal
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
