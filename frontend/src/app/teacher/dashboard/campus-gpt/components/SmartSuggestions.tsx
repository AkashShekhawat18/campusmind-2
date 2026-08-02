"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, BookOpen, Scissors, ListChecks, GraduationCap } from 'lucide-react';

interface SmartSuggestionsProps {
  isDark: boolean;
  onSelect: (prompt: string) => void;
}

const SUGGESTIONS = [
  { label: 'Explain More', icon: HelpCircle, prompt: 'Could you explain this in more detail with an example?' },
  { label: 'Summarize', icon: BookOpen, prompt: 'Please provide a concise summary of the above response.' },
  { label: 'Make Shorter', icon: Scissors, prompt: 'Make the previous response shorter and straight to the point.' },
  { label: 'Create Quiz', icon: ListChecks, prompt: 'Generate a 3-question multiple choice quiz based on this.' },
  { label: 'Study Notes', icon: GraduationCap, prompt: 'Format this information into bulleted study notes.' }
];

export function SmartSuggestions({ isDark, onSelect }: SmartSuggestionsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap gap-2 mt-4 ml-12"
    >
      <div className="flex items-center gap-2 mr-2">
        <Sparkles size={14} className="text-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Suggestions</span>
      </div>
      
      {SUGGESTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => onSelect(item.prompt)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:-translate-y-0.5 ${
              isDark 
                ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white' 
                : 'bg-black/5 border border-black/5 hover:bg-black/10 text-black/70 hover:text-black'
            }`}
          >
            <Icon size={12} />
            {item.label}
          </button>
        );
      })}
    </motion.div>
  );
}
