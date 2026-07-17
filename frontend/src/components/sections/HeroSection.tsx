'use client';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 py-20">
      <div className="text-center max-w-5xl mx-auto z-10 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ 
            duration: 1.2, 
            ease: [0.16, 1, 0.3, 1],
            y: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2
            }
          }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 text-foreground drop-shadow-2xl leading-[1.1]">
            <span>One Platform.</span>
            <br />
            <span className="text-gradient inline-block mt-2">Infinite Learning.</span>
          </h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl md:text-2xl text-foreground/60 max-w-2xl mx-auto font-bold"
        >
          Empowering Students, Teachers, and Administrators through an immersive, AI-driven educational ecosystem.
        </motion.p>
      </div>
    </section>
  );
}
