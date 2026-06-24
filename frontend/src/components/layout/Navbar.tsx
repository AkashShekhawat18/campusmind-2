'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        scrolled ? 'bg-background/95 backdrop-blur-xl border-b border-titanium py-4 shadow-2xl' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-cyan to-electric-violet flex items-center justify-center">
            <div className="w-4 h-4 bg-foreground/5 rounded-sm group-hover:scale-50 transition-transform duration-300" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Campus<span className="text-gradient">Mind</span>
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Home</Link>
          <Link href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Features</Link>
          <Link href="#about" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">About</Link>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-silver/20 hover:bg-silver/10 transition-colors text-foreground font-medium text-sm"
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun size={16} />
                  <span>Bright Theme</span>
                </>
              ) : (
                <>
                  <Moon size={16} />
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          )}
          <Link href="/admin/login">
            <button className="relative overflow-hidden rounded-full px-6 py-2 bg-gradient-to-b from-[#2a2a2c] to-[#1a1a1c] border border-white/10 text-sm font-semibold text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_4px_12px_rgba(0,0,0,0.5)] hover:from-[#3a3a3c] hover:to-[#2a2a2c] hover:border-white/20 transition-all cursor-pointer">
              Admin Portal
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
