"use client";

import React from 'react';
import { AnalysisReport } from './types';
import { AlertTriangle, Brain, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResultSummaryProps {
  report: AnalysisReport;
  isDark: boolean;
}

export function ResultSummary({ report, isDark }: ResultSummaryProps) {
  const overallRepetition = report.summary?.averageSimilarity || report.analytics?.overallRepetitionPercent || 0;
  const exact = report.summary?.matchCounts?.EXACT || report.analytics?.fullyRepeated || 0;
  const concept = report.summary?.matchCounts?.CONCEPT_REPEATED || report.analytics?.conceptRepeated || 0;
  const newQs = report.summary?.matchCounts?.NEW || report.analytics?.newQuestions || 0;

  const cards = [
    {
      title: "Exact/Fully Repeated",
      value: exact,
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-500",
      delay: 0.1
    },
    {
      title: "Concept Repeated",
      value: concept,
      icon: Brain,
      color: "text-amber-500",
      bg: "bg-amber-500",
      delay: 0.2
    },
    {
      title: "Fresh / New",
      value: newQs,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500",
      delay: 0.3
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl p-6 border shadow-lg relative overflow-hidden ${isDark ? 'bg-[#111113] border-white/10 shadow-black/50' : 'bg-white border-black/10 shadow-black/5'}`}
      >
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
        <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-60">Overall Repetition</p>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-5xl font-black tracking-tighter ${overallRepetition >= 70 ? 'text-rose-500' : overallRepetition >= 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {overallRepetition.toFixed(1)}<span className="text-3xl">%</span>
          </h3>
        </div>
        <div className="mt-6 h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overallRepetition}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${overallRepetition >= 70 ? 'bg-rose-500' : overallRepetition >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
          />
        </div>
      </motion.div>

      {cards.map((card, i) => (
        <motion.div 
          key={card.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: card.delay }}
          className={`rounded-2xl p-6 border flex flex-col justify-between hover:shadow-lg transition-all ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-black/5 hover:border-black/10'}`}
        >
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold opacity-60">{card.title}</p>
            <div className={`p-2 rounded-xl bg-opacity-10 ${card.bg} ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-4xl font-bold mt-4">{card.value}</h3>
        </motion.div>
      ))}
    </div>
  );
}
