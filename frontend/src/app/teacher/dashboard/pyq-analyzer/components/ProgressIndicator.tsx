"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, X } from 'lucide-react';

const STAGES = [
  { key: 'UPLOAD_STARTED', label: 'Uploading document...' },
  { key: 'UPLOAD_FINISHED', label: 'Uploading document...' },
  { key: 'VISION_STARTED', label: 'Reading document layout...' },
  { key: 'VISION_COMPLETED', label: 'Extracting questions...' },
  { key: 'QUESTION_EXTRACTION_STARTED', label: 'Analyzing question depth...' },
  { key: 'QUESTION_EXTRACTION_COMPLETED', label: 'Generating embeddings...' },
  { key: 'EMBEDDING_STARTED', label: 'Generating embeddings...' },
  { key: 'EMBEDDING_COMPLETED', label: 'Running similarity search...' },
  { key: 'SIMILARITY_STARTED', label: 'Running similarity search...' },
  { key: 'SIMILARITY_COMPLETED', label: 'Building report...' },
  { key: 'REPORT_STARTED', label: 'Building report...' },
  { key: 'REPORT_COMPLETED', label: 'Saving results...' },
  { key: 'DB_SAVE_STARTED', label: 'Saving results...' },
  { key: 'DB_SAVE_FINISHED', label: 'Finalizing...' },
  { key: 'COMPLETED', label: 'Done!' },
];

function getStageInfo(stage: string | null) {
  if (!stage) return { label: 'Preparing analysis...', progress: 5 };
  const idx = STAGES.findIndex(s => s.key === stage);
  if (idx === -1) return { label: 'Processing...', progress: 50 };
  const progress = Math.round(((idx + 1) / STAGES.length) * 100);
  return { label: STAGES[idx].label, progress };
}

interface ProgressIndicatorProps {
  isAnalyzing: boolean;
  currentStage: string | null;
  error?: string | null;
  isDark: boolean;
}

export function ProgressIndicator({ isAnalyzing, currentStage, error, isDark }: ProgressIndicatorProps) {
  const { label, progress } = useMemo(() => getStageInfo(currentStage), [currentStage]);

  if (!isAnalyzing) return null;

  return (
    <div className={`w-full max-w-md mx-auto p-8 rounded-3xl border shadow-2xl text-center ${isDark ? 'bg-[#111113] border-white/10 shadow-black/60' : 'bg-white border-black/10 shadow-black/10'}`}>
      {/* Animated icon */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-500/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-500/10"
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.05, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-10 h-10 text-emerald-500" />
          </motion.div>
        </div>
      </div>

      {/* Title */}
      <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Analyzing Your Paper
      </h2>

      {/* Current stage label */}
      <motion.p
        key={label}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm font-medium mb-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
      >
        {label}
      </motion.p>

      {/* Progress bar */}
      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Percentage */}
      <p className={`text-xs mt-3 font-mono ${isDark ? 'text-white/40' : 'text-black/40'}`}>
        {progress}%
      </p>

      {/* Subtle hint */}
      <p className={`text-[11px] mt-4 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
        This usually takes 15–30 seconds
      </p>
    </div>
  );
}
