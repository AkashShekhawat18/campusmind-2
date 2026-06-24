'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function CTASection() {
  return (
    <section id="cta" className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 z-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, margin: "-50px" }}
        transition={{ duration: 1 }}
        className="text-center max-w-4xl mx-auto relative z-10"
      >
        <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter drop-shadow-2xl">
          Begin the Evolution.
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
          <Link href="/student/login">
            <button className="px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-gray-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)] cursor-pointer">
              Student Access
            </button>
          </Link>
          <Link href="/teacher/login">
            <button className="px-8 py-4 rounded-full bg-transparent border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-colors backdrop-blur-md cursor-pointer">
              Teacher Access
            </button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
