'use client';
import { motion } from 'framer-motion';

export function ArchitectureSection() {
  return (
    <section id="about" className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 z-20 scroll-mt-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Platform Architecture</h2>
        <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">A hyper-connected ecosystem powered by distributed intelligence.</p>
      </div>

      <div className="w-full max-w-4xl mx-auto relative h-[600px] flex items-center justify-center">
        {/* Core Node */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute z-10 w-32 h-32 rounded-full bg-graphite border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center"
        >
          <div className="text-white font-bold text-lg">AI Core</div>
        </motion.div>

        {/* Orbiting Nodes */}
        {[
          { label: "Students", angle: 0 },
          { label: "Teachers", angle: 72 },
          { label: "Admins", angle: 144 },
          { label: "Database", angle: 216 },
          { label: "Auth", angle: 288 }
        ].map((node, i) => (
          <div
            key={i}
            className="absolute origin-center"
            style={{
              transform: `rotate(${node.angle}deg) translateX(240px) rotate(-${node.angle}deg)`
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ delay: i * 0.2, type: "spring", stiffness: 100 }}
              className="w-24 h-24 rounded-full glass-panel flex items-center justify-center border border-white/5 relative z-10 shadow-2xl"
            >
              <span className="text-gray-300 font-medium text-sm">{node.label}</span>
            </motion.div>
          </div>
        ))}
        
        {/* SVG Connectors Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10">
            {[0, 72, 144, 216, 288].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <motion.line 
                  key={i}
                  x1="50%" y1="50%" x2={`calc(50% + ${Math.cos(rad) * 240}px)`} y2={`calc(50% + ${Math.sin(rad) * 240}px)`}
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: false, margin: "-50px" }}
                  transition={{ duration: 1, delay: i * 0.2 }}
                />
              )
            })}
        </svg>
      </div>
    </section>
  );
}
