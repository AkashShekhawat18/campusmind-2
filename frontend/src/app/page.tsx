'use client';

import { useScroll, useSpring, motion } from 'framer-motion';
import { BackgroundScene } from '@/components/3d/BackgroundScene';
import { Navbar } from '@/components/layout/Navbar';
import { HeroAI } from '@/components/HeroAI';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { PortalsSection } from '@/components/sections/PortalsSection';
import { UIShowcaseSection } from '@/components/sections/UIShowcaseSection';
import { JourneySection } from '@/components/sections/JourneySection';
import { AdminShowcaseSection } from '@/components/sections/AdminShowcaseSection';
import { ArchitectureSection } from '@/components/sections/ArchitectureSection';
import { CTASection } from '@/components/sections/CTASection';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <main className="relative bg-background text-foreground overflow-hidden">
      {/* Global Background Elements */}
      <BackgroundScene />
      <Navbar />

      {/* Global Neural Thread */}
      <motion.div
        className="fixed top-0 left-4 md:left-12 bottom-0 w-[2px] bg-electric z-40 origin-top shadow-[0_0_20px_rgba(0,112,243,1)] pointer-events-none"
        style={{ scaleY }}
      />

      {/* Cinematic Scroll Sections */}
      <HeroAI />
      <PortalsSection />
      <HeroSection />
      <UIShowcaseSection />
      <FeaturesSection />
      <JourneySection />
      <AdminShowcaseSection />
      <ArchitectureSection />
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </main>
  );
}
