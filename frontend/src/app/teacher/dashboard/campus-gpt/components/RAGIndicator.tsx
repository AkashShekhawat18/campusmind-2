"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, FileText, Brain, Sparkles, CheckCircle2 } from 'lucide-react';

interface RAGIndicatorProps {
  isDark: boolean;
  onComplete?: () => void;
}

const RAG_STEPS = [
  { id: 'read', label: 'Reading Context', icon: FileText, duration: 800 },
  { id: 'embed', label: 'Generating Embeddings', icon: Database, duration: 1000 },
  { id: 'search', label: 'Searching Knowledge Base', icon: Search, duration: 1200 },
  { id: 'chunks', label: 'Extracting Relevant Chunks', icon: FileText, duration: 900 },
  { id: 'reason', label: 'Reasoning & Synthesis', icon: Brain, duration: 1500 },
  { id: 'generate', label: 'Generating Response', icon: Sparkles, duration: 500 }
];

export function RAGIndicator({ isDark, onComplete }: RAGIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep >= RAG_STEPS.length) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, RAG_STEPS[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <div className={`p-4 rounded-2xl border flex items-center justify-between overflow-hidden shadow-sm ${isDark ? 'bg-[#111113] border-white/10 text-white' : 'bg-white border-black/10 text-black'}`}>
      <div className="flex items-center gap-6 relative w-full">
        <AnimatePresence mode="popLayout">
          {RAG_STEPS.map((step, idx) => {
            if (idx !== currentStep) return null;
            const Icon = step.icon;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 w-full"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                  <Icon size={16} className={idx < RAG_STEPS.length - 1 ? 'animate-pulse' : ''} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-50">MALPHOR AI</span>
                  <span className="text-sm font-semibold">{step.label}...</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex gap-1.5 shrink-0 ml-auto">
          {RAG_STEPS.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'bg-indigo-500 scale-150' : idx < currentStep ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-black/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
