"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, ScanLine, Eye, Subscript, AlignLeft, Brain, Layers, FileOutput, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 'upload', label: 'Uploading', icon: UploadCloud },
  { id: 'read', label: 'Reading File', icon: FileText },
  { id: 'ocr', label: 'OCR', icon: ScanLine },
  { id: 'vision', label: 'Vision Analysis', icon: Eye },
  { id: 'latex', label: 'LaTeX Detection', icon: Subscript },
  { id: 'extract', label: 'Question Extraction', icon: AlignLeft },
  { id: 'semantic', label: 'Semantic Analysis', icon: Brain },
  { id: 'similarity', label: 'Similarity Matching', icon: Layers },
  { id: 'report', label: 'Generating Report', icon: FileOutput },
  { id: 'complete', label: 'Completed', icon: CheckCircle2 }
];

interface ProgressIndicatorProps {
  isAnalyzing: boolean;
  isDark: boolean;
}

export function ProgressIndicator({ isAnalyzing, isDark }: ProgressIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStepIndex(0);
      return;
    }

    // Simulate progress steps (the backend might take 10-30s depending on the paper)
    // We'll advance the step every 2.5 seconds artificially up to step 8.
    // Step 9 (Completed) will only hit when isAnalyzing turns false (handled by parent).
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < STEPS.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div className={`w-full max-w-2xl mx-auto my-12 p-8 rounded-3xl border shadow-xl ${isDark ? 'bg-[#111113] border-white/10 shadow-black/50' : 'bg-white border-black/10 shadow-black/5'}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-emerald-500 animate-pulse" />
          Processing Pipeline
        </h2>
        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          CampusMind AI is analyzing your document...
        </p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className={`absolute left-[27px] top-4 bottom-4 w-0.5 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        
        <div className="space-y-6 relative">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            const Icon = step.icon;

            return (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center gap-6 ${isPending ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : isCurrent
                      ? `bg-transparent border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]`
                      : isDark
                        ? 'bg-[#111113] border-white/20 text-white/50'
                        : 'bg-white border-black/20 text-black/50'
                }`}>
                  <Icon className={`w-6 h-6 ${isCurrent ? 'animate-pulse' : ''}`} />
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-lg font-bold transition-colors ${
                    isCurrent ? 'text-emerald-500' : isPending ? '' : isDark ? 'text-white' : 'text-black'
                  }`}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.5, ease: 'linear' }}
                      className="h-1 bg-emerald-500/30 rounded-full mt-2 overflow-hidden"
                    >
                      <div className="h-full bg-emerald-500 w-full animate-[shimmer_1.5s_infinite]" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
