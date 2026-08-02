"use client";

import React, { useState } from 'react';
import { SimilarityResult } from './types';
import LatexText from '@/components/LatexText';
import { motion, AnimatePresence } from 'framer-motion';
import { FileQuestion, AlertTriangle, Brain, CheckCircle2, ChevronDown, ChevronUp, Copy, Check, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  result: SimilarityResult;
  index: number;
  isDark: boolean;
  onReplace: (res: SimilarityResult, idx: number) => void;
  replacement?: { text: string; reasoning: string; loading: boolean };
}

export function QuestionCard({ result, index, isDark, onReplace, replacement }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (result.originalQuestion?.questionText) {
      navigator.clipboard.writeText(result.originalQuestion.questionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getBadgeStyle = () => {
    if (result.matchType === 'EXACT') return { bg: 'bg-rose-500', text: 'text-rose-500', lightBg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: AlertTriangle, label: '100% Exact Match' };
    if (result.matchType === 'CONCEPT_REPEATED') {
      if (result.overallSimilarity >= 95) return { bg: 'bg-orange-500', text: 'text-orange-500', lightBg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle, label: 'Nearly Identical' };
      return { bg: 'bg-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Brain, label: 'Concept Match' };
    }
    return { bg: 'bg-emerald-500', text: 'text-emerald-500', lightBg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2, label: 'Unique' };
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.05 }}
      className={`overflow-hidden rounded-2xl border transition-all ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'} ${expanded ? 'shadow-xl' : 'hover:shadow-md'}`}
    >
      <div className={`h-1.5 w-full ${style.bg}`} />
      
      {/* Header / Summary */}
      <div 
        className={`p-5 cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 flex gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.lightBg} ${style.text}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-bold opacity-50">Q{index + 1}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.border} ${style.text} ${style.lightBg}`}>
                {style.label} ({result.overallSimilarity}%)
              </span>
              {result.originalQuestion?.marks && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'border-white/10 bg-white/5 text-white/70' : 'border-black/10 bg-black/5 text-black/70'}`}>
                  {result.originalQuestion.marks} Marks
                </span>
              )}
            </div>
            <div className="text-base line-clamp-2 pr-4 leading-relaxed">
              {result.originalQuestion?.questionText ? <LatexText>{result.originalQuestion.questionText}</LatexText> : (result.sourceQuestionId ? `ID: ${result.sourceQuestionId.substring(0, 8)}` : 'New Question')}
            </div>
            
            {/* Metadata Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {result.originalQuestion?.metadata?.topic && (
                <span className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>Topic: {result.originalQuestion.metadata.topic}</span>
              )}
              {result.originalQuestion?.metadata?.concept && (
                <span className={`text-[10px] px-2 py-0.5 rounded ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>Concept: {result.originalQuestion.metadata.concept}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-center">
          <button 
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/10 text-black/50 hover:text-black'}`}
            title="Copy Question"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <div className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'}`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-5 pt-0 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <div className="flex flex-col lg:flex-row gap-6 mt-6">
                
                {/* Left Col: Questions Comparison */}
                <div className="flex-1 space-y-6">
                  {/* Current Question Full */}
                  <div>
                    <h5 className="text-xs uppercase tracking-wider font-bold opacity-50 mb-3">Current Question</h5>
                    <div className={`p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'} prose prose-sm dark:prose-invert max-w-none`}>
                      <LatexText>{result.originalQuestion?.questionText || ''}</LatexText>
                      {result.originalQuestion?.images && result.originalQuestion.images.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {result.originalQuestion.images.map((img: any, i: number) => (
                            <img key={i} src={`http://localhost:5000${img.url}`} alt={img.type} className="max-w-full rounded-lg border object-contain max-h-[300px]" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matched Historical Question */}
                  {result.targetQuestionId && (
                    <div>
                      <h5 className="text-xs uppercase tracking-wider font-bold opacity-50 mb-3 flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4" /> Most Similar Historical Question
                      </h5>
                      <div className={`p-4 rounded-xl border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'} prose prose-sm dark:prose-invert max-w-none`}>
                        <LatexText>{result.matchedQuestionText || ''}</LatexText>
                        {result.matchedQuestionImages && result.matchedQuestionImages.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {result.matchedQuestionImages.map((img: any, i: number) => (
                              <img key={i} src={`http://localhost:5000${img.url}`} alt={img.type} className="max-w-full rounded-lg border object-contain max-h-[200px]" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Reasoning */}
                  {result.reasoning && (
                    <div>
                      <h5 className="text-xs uppercase tracking-wider font-bold opacity-50 mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" /> AI Analysis & Differences
                      </h5>
                      <div className={`p-4 rounded-xl border-l-4 text-sm leading-relaxed ${isDark ? 'bg-white/5 border-indigo-500' : 'bg-black/5 border-indigo-500'}`}>
                        <LatexText>{result.reasoning}</LatexText>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Col: Metrics & Actions */}
                <div className="w-full lg:w-72 shrink-0 space-y-6">
                  {/* Similarity Metrics */}
                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}>
                    <h5 className="font-bold text-xs uppercase tracking-wider mb-4 opacity-50">Similarity Metrics</h5>
                    <div className="space-y-3">
                      {[
                        { label: "Concept", val: result.conceptMatch },
                        { label: "Logic", val: result.logicMatch },
                        { label: "Formula", val: result.formulaMatch },
                        { label: "Pattern", val: result.patternMatch },
                        { label: "Values", val: result.valuesMatch }
                      ].map(d => (
                        <div key={d.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="opacity-80">{d.label}</span>
                            <span className="font-mono font-medium">{d.val || 0}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                            <div className={`h-full rounded-full ${d.val && d.val >= 80 ? 'bg-rose-500' : d.val && d.val >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${d.val || 0}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generate Replacement Action */}
                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <h5 className="font-bold text-xs uppercase tracking-wider mb-2 text-indigo-500">Need a variation?</h5>
                    <p className="text-xs opacity-70 mb-4">Generate a fresh question testing the exact same concepts but with different logic and values.</p>
                    <button 
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      onClick={(e) => { e.stopPropagation(); onReplace(result, index); }}
                      disabled={replacement?.loading}
                    >
                      {replacement?.loading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {replacement?.loading ? "Generating..." : "Generate AI Replacement"}
                    </button>

                    {/* Replacement Result */}
                    {replacement && !replacement.loading && replacement.text && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-indigo-500/20">
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none mb-3">
                          <LatexText>{replacement.text}</LatexText>
                        </div>
                        {replacement.reasoning && (
                          <div className="text-[10px] opacity-70 italic p-2 rounded bg-indigo-500/10">
                            <LatexText>{replacement.reasoning}</LatexText>
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(replacement.text);
                          }}
                          className="mt-3 w-full py-1.5 rounded border border-indigo-500/30 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors flex justify-center items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy Replacement
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
