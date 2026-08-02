'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Edit3, Trash2, Copy, RefreshCw, ChevronDown, ChevronUp, Check } from 'lucide-react';

export interface QuestionData {
  id: string;
  type: 'mcq' | 'subjective' | 'coding' | 'numerical' | 'case_study' | 'true_false' | 'fill_blank' | 'diagram' | 'latex';
  text: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomLevel?: string;
  topic?: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
}

const typeLabels: Record<string, string> = {
  mcq: 'MCQ', subjective: 'Subjective', coding: 'Coding', numerical: 'Numerical',
  case_study: 'Case Study', true_false: 'True/False', fill_blank: 'Fill in Blank',
  diagram: 'Diagram', latex: 'LaTeX',
};

const difficultyColors: Record<string, { dark: string; light: string }> = {
  easy: { dark: 'text-emerald-400 bg-emerald-500/10', light: 'text-emerald-600 bg-emerald-50' },
  medium: { dark: 'text-amber-400 bg-amber-500/10', light: 'text-amber-600 bg-amber-50' },
  hard: { dark: 'text-red-400 bg-red-500/10', light: 'text-red-600 bg-red-50' },
};

interface QuestionCardProps {
  question: QuestionData;
  index: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  compact?: boolean;
}

export function QuestionCard({ question, index, onEdit, onDelete, onDuplicate, onRegenerate, compact = false }: QuestionCardProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const diffColor = difficultyColors[question.difficulty] || difficultyColors.medium;

  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-all ${
        isDark
          ? 'bg-white/5 border border-white/5 hover:border-white/10'
          : 'bg-white border border-black/5 hover:border-black/10'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${
          isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical size={14} className="opacity-20 flex-shrink-0 cursor-grab" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
          isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
        }`}>
          Q{index + 1}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
          isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
        }`}>
          {typeLabels[question.type] || question.type}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
          isDark ? diffColor.dark : diffColor.light
        }`}>
          {question.difficulty}
        </span>
        <span className={`text-xs ml-auto ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(question.id); }} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
              <Edit3 size={13} className="opacity-50" />
            </button>
          )}
          {onDuplicate && (
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(question.id); }} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
              <Copy size={13} className="opacity-50" />
            </button>
          )}
          {onRegenerate && (
            <button onClick={(e) => { e.stopPropagation(); onRegenerate(question.id); }} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
              <RefreshCw size={13} className="opacity-50" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(question.id); }} className={`p-1.5 rounded-lg text-red-400 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
              <Trash2 size={13} />
            </button>
          )}
          {expanded ? <ChevronUp size={14} className="opacity-30" /> : <ChevronDown size={14} className="opacity-30" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
          <p className={`text-sm mt-3 leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            {question.text}
          </p>

          {/* MCQ Options */}
          {question.type === 'mcq' && question.options && (
            <div className="mt-3 space-y-2">
              {question.options.map((opt, oi) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                    opt.isCorrect
                      ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                      : (isDark ? 'bg-white/[0.03] text-white/60' : 'bg-black/[0.02] text-black/60')
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    opt.isCorrect
                      ? 'bg-emerald-500 text-white'
                      : (isDark ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/50')
                  }`}>
                    {opt.isCorrect ? <Check size={12} /> : String.fromCharCode(65 + oi)}
                  </span>
                  {opt.text}
                </div>
              ))}
            </div>
          )}

          {/* Answer for non-MCQ */}
          {question.type !== 'mcq' && question.correctAnswer && (
            <div className={`mt-3 px-3 py-2 rounded-xl text-sm ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className="font-medium">Answer: </span>{question.correctAnswer}
            </div>
          )}

          {/* Meta */}
          {(question.topic || question.bloomLevel) && (
            <div className={`flex items-center gap-3 mt-3 text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {question.topic && <span>Topic: {question.topic}</span>}
              {question.bloomLevel && <span>Bloom&apos;s: {question.bloomLevel}</span>}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
