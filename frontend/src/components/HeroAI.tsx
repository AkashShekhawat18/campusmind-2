'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { InteractiveOrb } from './InteractiveOrb';
import { VoiceAssistant } from './VoiceAssistant';

export function HeroAI() {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const handleGetStarted = () => {
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth' });
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
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-6 drop-shadow-2xl">
          Intelligence at the Core.
        </h1>
        <p className="text-xl md:text-2xl text-white/60 max-w-2xl font-light mb-12">
          Experience a truly reactive, intelligent ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="px-8 py-4 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-md text-white font-semibold text-lg hover:bg-blue-500/30 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] cursor-pointer"
          >
            TRY NOW
          </button>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
          >
            GET STARTED
          </button>
        </div>
      </motion.div>

      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </section>
  );
}
