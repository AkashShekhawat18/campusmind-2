'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function UIShowcaseSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [45, 0, -20]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [150, 0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 z-20 overflow-hidden">
      <div className="text-center mb-20 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl"
        >
          Experience the Platform
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-400 font-light max-w-2xl mx-auto drop-shadow-lg"
        >
          Immersive workspaces designed for deep focus and intelligent workflows.
        </motion.p>
      </div>

      <div className="w-full max-w-7xl mx-auto relative perspective-[2000px] z-10">
        <motion.div
          style={{ rotateX, y, opacity }}
          className="w-full aspect-[16/9] glass-panel rounded-3xl border border-white/10 p-4 shadow-[0_30px_100px_-20px_rgba(0,112,243,0.3)] relative overflow-hidden"
        >
          <div className="w-full h-full rounded-2xl border border-white/5 bg-[#0a0a0c]/80 flex flex-col overflow-hidden">
            <div className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-white/[0.02]">
              <div className="flex gap-4">
                <div className="w-3 h-3 rounded-full bg-white/10"></div>
                <div className="w-3 h-3 rounded-full bg-white/10"></div>
                <div className="w-3 h-3 rounded-full bg-white/10"></div>
              </div>
              <div className="w-32 h-6 rounded-md bg-white/5"></div>
            </div>
            <div className="flex-1 flex p-6 gap-6">
              <div className="w-48 flex flex-col gap-4">
                <div className="w-full h-8 rounded-md bg-white/10"></div>
                <div className="w-full h-8 rounded-md bg-white/5"></div>
                <div className="w-full h-8 rounded-md bg-white/5"></div>
              </div>
              <div className="flex-1 flex flex-col gap-6">
                <div className="w-2/3 h-12 rounded-lg bg-white/5"></div>
                <div className="flex-1 grid grid-cols-3 gap-6">
                  <div className="col-span-2 rounded-xl bg-white/5 flex p-6 flex-col gap-4">
                     <div className="w-1/2 h-6 rounded bg-white/10"></div>
                     <div className="w-full h-full rounded bg-white/5"></div>
                  </div>
                  <div className="col-span-1 rounded-xl border border-white/5 flex flex-col p-4 gap-4 bg-white/[0.02]">
                    <div className="w-full h-1/2 rounded-md bg-electric/10 border border-electric/20"></div>
                    <div className="w-full h-1/2 rounded-md bg-white/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
