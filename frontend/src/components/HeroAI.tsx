'use client';
import { motion } from 'framer-motion';
import { InteractiveOrb } from './InteractiveOrb';
import { useAudioManager } from '@/hooks/useAudioManager';

import Link from 'next/link';

export function HeroAI() {
  const { playAudio } = useAudioManager();

  const handleGetStarted = () => {
    const portalsSection = document.getElementById('portals');
    if (portalsSection) {
      portalsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden z-20 pt-20">
      {/* Background Interactive Orb */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-50">
        <InteractiveOrb />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-6 mt-[-10vh]"
      >
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60 mb-6 drop-shadow-2xl">
          Intelligence at the Core.
        </h1>
        <p className="text-xl md:text-2xl text-foreground/60 max-w-2xl font-light mb-12">
          Experience a truly reactive, intelligent ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Link href="/campus-gpt-demo">
            <button
              onClick={() => playAudio('tryNow')}
              className="px-10 py-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 border border-blue-400/50 text-white font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(0,112,243,0.5)] hover:shadow-[0_0_80px_rgba(0,229,255,0.6)] cursor-pointer"
            >
              TRY NOW
            </button>
          </Link>
          <button
            onClick={() => { playAudio('getStarted'); handleGetStarted(); }}
            className="px-8 py-4 rounded-full bg-foreground/10 border border-foreground/20 text-foreground font-semibold text-lg hover:bg-foreground/20 hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
          >
            GET STARTED
          </button>
        </div>
      </motion.div>
    </section>
  );
}
