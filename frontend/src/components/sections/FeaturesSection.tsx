'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Sparkles, Brain, Zap, Target, Shield } from 'lucide-react';

export function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features = [
    { 
      title: "Dynamic Curriculum", 
      desc: "AI adapts course material to student pace instantly, rewriting content on the fly.",
      icon: Brain,
      position: { top: "10%", left: "15%" },
      color: "#0070F3" // electric
    },
    { 
      title: "Predictive Analytics", 
      desc: "Identify at-risk students before they fall behind through multi-variable tracking.",
      icon: Target,
      position: { top: "40%", left: "70%" },
      color: "var(--foreground)" 
    },
    { 
      title: "Automated Grading", 
      desc: "Zero-latency evaluation for objective assessments and essays.",
      icon: Zap,
      position: { top: "70%", left: "20%" },
      color: "#00E5FF" // cyan
    },
    { 
      title: "Adaptive Workflows", 
      desc: "Seamless synchronization between teacher planning and student dashboards.",
      icon: Sparkles,
      position: { top: "20%", left: "55%" },
      color: "var(--foreground)" 
    },
    { 
      title: "Secure Verification", 
      desc: "Enterprise-grade encryption and biometric anti-cheat mechanisms.",
      icon: Shield,
      position: { top: "65%", left: "60%" },
      color: "var(--foreground)" 
    }
  ];

  return (
    <section id="features" className="relative min-h-[120vh] flex flex-col items-center py-32 z-20 overflow-hidden scroll-mt-24">
      <div className="text-center mb-10 relative z-30 pointer-events-none">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Interactive Exploration</h2>
        <p className="text-xl text-foreground font-bold max-w-2xl mx-auto">Hover to discover the capabilities driving the ecosystem.</p>
      </div>

      {/* Floating Canvas */}
      <div className="relative w-full max-w-5xl mx-auto h-[600px] mt-10">
        {features.map((feature, i) => {
          const isHovered = hoveredIndex === i;
          const Icon = feature.icon;
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ delay: i * 0.15, type: "spring" }}
              className="absolute z-10"
              style={{ top: feature.position.top, left: feature.position.left }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.div
                layout
                animate={{
                  width: isHovered ? 340 : 80,
                  height: isHovered ? 140 : 80,
                  borderRadius: isHovered ? 24 : 40,
                  backgroundColor: isHovered ? "var(--titanium)" : "var(--glass-bg)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="glass-panel overflow-hidden border border-foreground/10 shadow-2xl flex flex-col relative group cursor-crosshair"
              >
                {/* Background glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${feature.color.replace('1)', '0.15)')} 0%, transparent 70%)`,
                    opacity: isHovered ? 1 : 0
                  }}
                />

                {/* Content Container */}
                <div className="flex items-center h-full p-6">
                  {/* Icon Block */}
                  <div className="w-[32px] h-[32px] shrink-0 flex items-center justify-center relative z-10">
                    <Icon className="w-8 h-8" style={{ color: feature.color }} />
                  </div>

                  {/* Revealed Text */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 flex flex-col justify-center w-[250px] relative z-10"
                      >
                        <h3 className="text-lg font-bold text-foreground mb-1 whitespace-nowrap">{feature.title}</h3>
                        <p className="text-sm text-foreground font-bold leading-relaxed">{feature.desc}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
