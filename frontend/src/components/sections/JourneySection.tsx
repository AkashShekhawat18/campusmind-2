'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const studentSteps = ["Register", "Approval", "Login", "Learning Platform", "Resources", "Progress"];
const teacherSteps = ["Register", "Approval", "Login", "Content Management", "Question Generation", "Analytics"];

export function JourneySection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1]);

  return (
    <section ref={ref} className="relative min-h-[150vh] flex flex-col items-center py-32 z-20">
      <div className="text-center mb-24 relative z-30 pointer-events-none">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight drop-shadow-2xl">The Frictionless Journey</h2>
        <p className="text-xl text-foreground font-bold max-w-2xl mx-auto drop-shadow-lg">From onboarding to daily workflows, every step is optimized.</p>
      </div>

      <div className="relative w-full max-w-5xl mx-auto grid grid-cols-2 gap-8 md:gap-20">
        {/* SVG Line Background */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/10 -translate-x-1/2"></div>
        <motion.div 
          className="absolute left-1/2 top-0 bottom-0 w-px bg-electric -translate-x-1/2 origin-top"
          style={{ scaleY: pathLength }}
        ></motion.div>

        {/* Student Column */}
        <div className="flex flex-col gap-32 pt-20">
          <h3 className="text-2xl font-bold text-foreground text-right mb-10 text-electric">Student Flow</h3>
          {studentSteps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              className="text-right relative"
            >
              <div className="absolute -right-[calc(1rem+1px)] md:-right-[calc(2.5rem+1px)] top-1/2 w-4 h-4 rounded-full bg-background border-2 border-electric -translate-y-1/2 z-10"></div>
              <div className="glass-panel p-4 md:p-6 rounded-2xl inline-block border border-foreground/5 shadow-xl hover:border-electric/50 transition-colors">
                <span className="text-sm md:text-lg font-medium text-foreground/80">{step}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Teacher Column */}
        <div className="flex flex-col gap-32 pt-40">
          <h3 className="text-2xl font-bold text-foreground text-left mb-10 text-silver">Teacher Flow</h3>
          {teacherSteps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-100px" }}
              className="text-left relative"
            >
              <div className="absolute -left-[calc(1rem+1px)] md:-left-[calc(2.5rem+1px)] top-1/2 w-4 h-4 rounded-full bg-background border-2 border-silver -translate-y-1/2 z-10"></div>
              <div className="glass-panel p-4 md:p-6 rounded-2xl inline-block border border-foreground/5 shadow-xl hover:border-silver/50 transition-colors">
                <span className="text-sm md:text-lg font-medium text-foreground/80">{step}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
