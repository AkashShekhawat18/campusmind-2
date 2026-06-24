'use client';
import { motion } from 'framer-motion';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { GraduationCap, User, LineChart, ShieldCheck, Database, Zap } from 'lucide-react';
import Link from 'next/link';

export function PortalsSection() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 py-20 z-20">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16"
      >
        <InteractiveCard className="h-[500px]">
          <div className="flex flex-col h-full z-30" style={{ transform: "translateZ(60px)" }}>
            <div className="w-16 h-16 rounded-2xl bg-electric/10 flex items-center justify-center mb-8 border border-electric/20 backdrop-blur-md shadow-2xl">
              <GraduationCap className="w-8 h-8 text-electric" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">Student Portal</h2>
            <p className="text-foreground/60 mb-8 flex-1 text-lg font-bold leading-relaxed">
              Access your AI Learning Assistant, track assignments, and view smart analytics for your academic journey.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-2 text-sm text-foreground/70 font-medium">
                <Zap className="w-4 h-4 text-electric" /> AI Assistant
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/70 font-medium">
                <LineChart className="w-4 h-4 text-electric" /> Smart Analytics
              </div>
            </div>
            <Link href="/student/login" className="w-full block">
              <button className="w-full py-4 rounded-xl bg-foreground text-background font-semibold text-lg hover:opacity-90 transition-opacity shadow-xl shadow-foreground/10 cursor-pointer">
                Enter Student Portal
              </button>
            </Link>
          </div>
        </InteractiveCard>

        <InteractiveCard className="h-[500px]">
          <div className="flex flex-col h-full z-30" style={{ transform: "translateZ(60px)" }}>
            <div className="w-16 h-16 rounded-2xl bg-silver/10 flex items-center justify-center mb-8 border border-silver/20 backdrop-blur-md shadow-2xl">
              <User className="w-8 h-8 text-silver" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">Teacher Portal</h2>
            <p className="text-foreground/60 mb-8 flex-1 text-lg font-bold leading-relaxed">
              Generate questions with AI, analyze student performance, and manage your content seamlessly in a unified workspace.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-2 text-sm text-foreground/70 font-medium">
                <Database className="w-4 h-4 text-silver" /> Content Gen
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/70 font-medium">
                <ShieldCheck className="w-4 h-4 text-silver" /> Performance
              </div>
            </div>
            <Link href="/teacher/login" className="w-full block">
              <button className="w-full py-4 rounded-xl bg-transparent border border-foreground/20 text-foreground font-semibold text-lg hover:bg-foreground/5 transition-colors backdrop-blur-md cursor-pointer">
                Enter Teacher Portal
              </button>
            </Link>
          </div>
        </InteractiveCard>
      </motion.div>
    </section>
  );
}
