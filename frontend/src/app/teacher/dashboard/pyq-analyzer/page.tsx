"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { ChevronLeft, Bot, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import PYQChatbot from '@/components/PYQChatbot';
import { AnalysisReport, AnalysisHistoryItem, SimilarityResult } from './components/types';

import { UploadSection } from './components/UploadSection';
import { ProgressIndicator } from './components/ProgressIndicator';
import { AnalysisHistory } from './components/AnalysisHistory';
import { ResultSummary } from './components/ResultSummary';
import { QuestionCard } from './components/QuestionCard';
import { Filters } from './components/Filters';

export default function TeacherPYQAnalyzer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  
  // History State
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Replacements State
  const [replacements, setReplacements] = useState<Record<number, { text: string, reasoning: string, loading: boolean }>>({});
  
  // Chatbots State
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [isPaperChatOpen, setIsPaperChatOpen] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXACT' | 'CONCEPT' | 'NEW'>('ALL');

  useEffect(() => {
    setMounted(true);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("teacherToken");
      const res = await fetch(`http://localhost:5000/api/pyq/analysis/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAnalyze = async (files: File[]) => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    
    try {
      // Process sequentially to respect backend limits
      let lastReport = null;
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        
        const token = localStorage.getItem("teacherToken");
        const res = await fetch(`http://localhost:5000/api/pyq/analyze`, {
          method: 'POST',
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        
        if (res.ok) {
          lastReport = await res.json();
        } else {
          console.error(`Failed to analyze ${file.name}`);
        }
      }

      if (lastReport) {
        setReport(lastReport);
        fetchHistory();
      } else {
        alert("Failed to analyze files.");
      }
    } catch (e) {
      console.error(e);
      alert("Error analyzing files.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenAnalysis = async (id: string) => {
    try {
      const token = localStorage.getItem("teacherToken");
      const res = await fetch(`http://localhost:5000/api/pyq/analysis/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport({ ...data.similarityResult, analysisId: id });
        setSearchTerm('');
        setFilterType('ALL');
      } else {
        alert("Failed to fetch analysis details.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis?")) return;
    
    try {
      const token = localStorage.getItem("teacherToken");
      const res = await fetch(`http://localhost:5000/api/pyq/analysis/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplaceQuestion = async (res: SimilarityResult, idx: number) => {
    if (!res.originalQuestion) {
      alert("Original question context missing. Please analyze a new paper to get context.");
      return;
    }
    
    setReplacements(prev => ({ ...prev, [idx]: { text: '', reasoning: '', loading: true } }));
    
    try {
      const token = localStorage.getItem("teacherToken");
      const apiRes = await fetch(`http://localhost:5000/api/pyq/replace`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ originalQuestion: res.originalQuestion })
      });
      
      if (apiRes.ok) {
        const data = await apiRes.json();
        setReplacements(prev => ({ 
          ...prev, 
          [idx]: { 
            text: data.replacement?.replacementText || data.replacementText, 
            reasoning: data.replacement?.reasoning || data.reasoning || '', 
            loading: false 
          } 
        }));
      } else {
        setReplacements(prev => ({ ...prev, [idx]: { text: 'Failed to generate replacement.', reasoning: '', loading: false } }));
      }
    } catch (e) {
      console.error(e);
      setReplacements(prev => ({ ...prev, [idx]: { text: 'An error occurred during generation.', reasoning: '', loading: false } }));
    }
  };

  // Filter and Search Logic
  const filteredQuestions = useMemo(() => {
    if (!report?.similarityResults) return [];
    
    return report.similarityResults.filter(q => {
      // Type Filter
      if (filterType === 'EXACT' && q.matchType !== 'EXACT') return false;
      if (filterType === 'CONCEPT' && q.matchType !== 'CONCEPT_REPEATED') return false;
      if (filterType === 'NEW' && q.matchType !== 'NEW') return false;
      
      // Search Term Filter
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const text = q.originalQuestion?.questionText?.toLowerCase() || '';
        const matched = q.matchedQuestionText?.toLowerCase() || '';
        const topic = q.originalQuestion?.metadata?.topic?.toLowerCase() || '';
        const concept = q.originalQuestion?.metadata?.concept?.toLowerCase() || '';
        
        if (!text.includes(s) && !matched.includes(s) && !topic.includes(s) && !concept.includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [report, filterType, searchTerm]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600">
            PYQ Analyzer Pro
          </h1>
          <p className={`text-sm mt-2 font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Deep semantic evaluation against historical question papers.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!report ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col md:flex-row gap-6 relative"
          >
            {isAnalyzing && (
              <div className="absolute inset-0 z-50 bg-black/20 dark:bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4">
                <ProgressIndicator isAnalyzing={isAnalyzing} isDark={isDark} />
              </div>
            )}
            
            <UploadSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} isDark={isDark} />
            <AnalysisHistory 
              history={history} 
              loading={loadingHistory} 
              onOpen={handleOpenAnalysis} 
              onDelete={handleDeleteAnalysis} 
              isDark={isDark} 
            />
          </motion.div>
        ) : (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <button 
                onClick={() => setReport(null)}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all w-fit shadow-sm ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
              >
                <ChevronLeft className="w-4 h-4" /> Back to History
              </button>
              <button
                onClick={() => setIsPaperChatOpen(true)}
                className={`flex items-center justify-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'}`}
              >
                <Bot className="w-5 h-5" /> Chat with Analysis AI
              </button>
            </div>
            
            <ResultSummary report={report} isDark={isDark} />
            
            <Filters 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              filterType={filterType} 
              setFilterType={setFilterType} 
              isDark={isDark} 
            />

            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className={`text-center py-12 px-6 rounded-2xl border border-dashed ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                  <p className="opacity-50">No questions match your current filters.</p>
                </div>
              ) : (
                filteredQuestions.map((res, idx) => (
                  <QuestionCard 
                    key={res.sourceQuestionId || idx}
                    result={res} 
                    index={idx} 
                    isDark={isDark} 
                    onReplace={handleReplaceQuestion}
                    replacement={replacements[idx]}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Global Chatbot Button */}
      {!report && !isAnalyzing && (
        <button
          onClick={() => setIsGlobalChatOpen(true)}
          className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 z-40 flex items-center justify-center ${
            isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/50'
          }`}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chatbots */}
      <PYQChatbot 
        chatType="GLOBAL" 
        isOpen={isGlobalChatOpen} 
        onClose={() => setIsGlobalChatOpen(false)} 
      />
      
      <PYQChatbot 
        chatType="PAPER" 
        analysisId={report?.analysisId}
        isOpen={isPaperChatOpen} 
        onClose={() => setIsPaperChatOpen(false)} 
      />
    </div>
  );
}
