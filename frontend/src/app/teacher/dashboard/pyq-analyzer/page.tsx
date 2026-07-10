"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Upload, Brain, Loader2, FileQuestion, CheckCircle2, AlertTriangle, FileText, Calendar, Clock, ChevronLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PYQChatbot from '@/components/PYQChatbot';
import LatexText from '@/components/LatexText';
import { Bot, MessageSquare } from 'lucide-react';

export default function TeacherPYQAnalyzer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [replacements, setReplacements] = useState<Record<number, { text: string, reasoning: string, loading: boolean }>>({});
  
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [isPaperChatOpen, setIsPaperChatOpen] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const token = localStorage.getItem("teacherToken");
      const res = await fetch(`http://localhost:5000/api/pyq/analyze`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        fetchHistory(); // Refresh history list
      } else {
        alert("Failed to analyze paper.");
      }
    } catch (e) {
      console.error(e);
      alert("Error analyzing paper.");
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

  const handleReplaceQuestion = async (res: any, idx: number) => {
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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600">
            AI Paper Analyzer
          </h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Evaluate your upcoming question paper against historical data.
          </p>
        </div>
      </div>

      {!report ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT SIDE: Upload Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
            className={`w-full md:w-1/3 shrink-0 rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'} flex flex-col h-fit`}
          >
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex-1 flex flex-col items-center justify-center ${isDark ? 'border-white/10 hover:bg-white/5 hover:border-emerald-500/50' : 'border-black/10 hover:bg-black/5 hover:border-emerald-500/50'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
              />
              
              <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-emerald-400" />
              </div>
              
              <h3 className="text-lg font-semibold mb-1">
                {file ? file.name : 'Upload Current Paper'}
              </h3>
              <p className={`text-xs mb-6 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag & drop PDF or Image'}
              </p>
              
              <button 
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all text-sm ${
                  (!file || isAnalyzing) ? 'bg-emerald-600/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/20'
                }`}
                onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                disabled={!file || isAnalyzing}
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Start Analysis</>
                )}
              </button>
            </div>
          </motion.div>

          {/* RIGHT SIDE: History Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
            className={`w-full md:w-2/3 rounded-2xl border flex flex-col ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
          >
            <div className={`p-6 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 opacity-70" /> Analysis History
              </h2>
            </div>
            
            <div className="p-6 flex-1 max-h-[600px] overflow-y-auto space-y-3 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                </div>
              ) : history.length === 0 ? (
                <div className={`text-center py-12 px-6 rounded-xl border border-dashed ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <h3 className="text-lg font-medium opacity-80 mb-1">No previous paper analysis yet</h3>
                  <p className="text-sm opacity-50">Upload a paper on the left to start your first analysis.</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div 
                    key={item.id}
                    onClick={() => handleOpenAnalysis(item.id)}
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 ${
                      isDark ? 'bg-black/20 border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5' : 'bg-black/5 border-black/5 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <h4 className="font-semibold text-base mb-1 truncate pr-8">{item.title}</h4>
                      <div className={`flex flex-wrap gap-3 text-xs opacity-60`}>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] uppercase tracking-wider font-semibold opacity-50 mb-0.5">Repetition</div>
                        <div className={`text-lg font-bold ${item.overallRepetition >= 70 ? 'text-rose-500' : item.overallRepetition >= 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {item.overallRepetition ? item.overallRepetition.toFixed(1) : 0}%
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteAnalysis(item.id, e)}
                        className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-500'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setReport(null)}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors w-fit ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
            >
              <ChevronLeft className="w-4 h-4" /> Back to History
            </button>
            <button
              onClick={() => setIsPaperChatOpen(true)}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'}`}
            >
              <Bot className="w-4 h-4" /> Ask This Paper AI
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Overall Repetition</p>
              <h3 className="text-4xl font-bold text-rose-400">{report.summary?.averageSimilarity?.toFixed(1) || report.analytics?.overallRepetitionPercent || 0}%</h3>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-current bg-opacity-10">
                <div className="h-full bg-rose-500" style={{ width: `${report.summary?.averageSimilarity || report.analytics?.overallRepetitionPercent || 0}%` }}></div>
              </div>
            </div>
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Exact/Fully Repeated</p>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <h3 className="text-3xl font-bold">{report.summary?.matchCounts?.EXACT || report.analytics?.fullyRepeated || 0}</h3>
              </div>
            </div>
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Concept Repeated</p>
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-amber-500" />
                <h3 className="text-3xl font-bold">{report.summary?.matchCounts?.CONCEPT_REPEATED || report.analytics?.conceptRepeated || 0}</h3>
              </div>
            </div>
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Fresh / New</p>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <h3 className="text-3xl font-bold">{report.summary?.matchCounts?.NEW || report.analytics?.newQuestions || 0}</h3>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Question Similarity Details</h2>
          <div className="space-y-4">
            {report.similarityResults?.map((res: any, idx: number) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className={`overflow-hidden rounded-2xl border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
              >
                <div className={`h-1 w-full ${res.matchType === 'EXACT' ? 'bg-rose-500' : res.matchType === 'CONCEPT_REPEATED' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-lg flex items-start gap-2">
                        <FileQuestion className="w-5 h-5 opacity-50 mt-1 shrink-0"/> 
                        <span>
                          <span className="text-sm opacity-50 block mb-1">Current Question:</span>
                          {res.originalQuestion?.questionText ? <LatexText>{res.originalQuestion.questionText}</LatexText> : (res.sourceQuestionId ? `Question ID: ${res.sourceQuestionId.substring(0, 8)}` : 'NEW')}
                          {res.originalQuestion?.images && res.originalQuestion.images.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {res.originalQuestion.images.map((img: any, i: number) => (
                                <div key={i} className="flex flex-col gap-1">
                                  <img 
                                    src={`http://localhost:5000${img.url}`} 
                                    alt={img.description || 'Question visual element'} 
                                    className={`max-w-full rounded-xl border object-contain ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}
                                    style={{ maxHeight: '300px' }}
                                  />
                                  <span className="text-xs opacity-50 italic">Attached Diagram: {img.type}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </span>
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border h-fit whitespace-nowrap ${
                        res.matchType === 'EXACT' ? 'border-rose-500 text-rose-500 bg-rose-500/10' : 
                        res.matchType === 'CONCEPT_REPEATED' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
                        'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                      }`}>
                        {res.overallSimilarity}% Match
                      </span>
                    </div>
                    
                    {res.targetQuestionId && (
                      <div className={`p-4 rounded-lg text-sm whitespace-pre-wrap ${isDark ? 'bg-black/30' : 'bg-black/5'}`}>
                        <span className="font-semibold opacity-70 block mb-1 text-xs uppercase tracking-wider">Matched With Historical Question:</span>
                        {res.matchedQuestionText ? <LatexText>{res.matchedQuestionText}</LatexText> : `Question ID: ${res.targetQuestionId.substring(0, 8)}`}
                        {res.matchedQuestionImages && res.matchedQuestionImages.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {res.matchedQuestionImages.map((img: any, i: number) => (
                              <div key={i} className="flex flex-col gap-1">
                                <img 
                                  src={`http://localhost:5000${img.url}`} 
                                  alt={img.description || 'Historical question visual element'} 
                                  className={`max-w-full rounded-xl border object-contain ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}
                                  style={{ maxHeight: '200px' }}
                                />
                                <span className="text-xs opacity-50 italic">Historical Diagram: {img.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className={`text-sm border-l-2 pl-4 py-1 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                      <span className="font-semibold opacity-70">AI Reasoning: </span>
                      {res.reasoning}
                    </p>
                  </div>
                  
                  <div className={`w-full md:w-64 space-y-3 p-4 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}>
                    <h5 className="font-semibold text-xs uppercase tracking-wider mb-3 opacity-50">6-Dimension Breakdown</h5>
                    {[
                      { label: "Concept (35%)", val: res.conceptMatch },
                      { label: "Logic (30%)", val: res.logicMatch },
                      { label: "Formula (15%)", val: res.formulaMatch },
                      { label: "Pattern (10%)", val: res.patternMatch },
                      { label: "Values (5%)", val: res.valuesMatch }
                    ].map(d => (
                      <div key={d.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="opacity-80">{d.label}</span>
                          <span className="font-mono">{d.val || 0}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden bg-current bg-opacity-10">
                          <div className="h-full bg-current opacity-50" style={{ width: `${d.val || 0}%` }}></div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                      onClick={() => handleReplaceQuestion(res, idx)}
                      disabled={replacements[idx]?.loading}
                    >
                      {replacements[idx]?.loading ? "Generating..." : "Generate Replacement"}
                    </button>
                    
                    {replacements[idx] && !replacements[idx].loading && (
                      <div className={`mt-4 p-4 rounded-xl border border-emerald-500/30 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                        <h6 className="font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> New AI Question
                        </h6>
                        <p className="text-sm mb-3">{replacements[idx].text}</p>
                        {replacements[idx].reasoning && (
                          <p className="text-xs opacity-70 italic border-t border-emerald-500/20 pt-2 mb-2">Reasoning: {replacements[idx].reasoning}</p>
                        )}
                        <div className={`mt-2 p-2 rounded bg-black/5 text-xs opacity-80 border-l-2 border-emerald-500/50`}>
                          <span className="font-semibold block mb-1">Replaced Question:</span>
                          <p className="truncate mb-1">{res.originalQuestion?.questionText}</p>
                          <p className="font-mono text-[10px]">
                            Concept: {res.originalQuestion?.metadata?.concept || 'N/A'} | 
                            Difficulty: {res.originalQuestion?.metadata?.difficulty || 'N/A'} | 
                            Marks: {res.originalQuestion?.marks || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Global Chatbot Button */}
      {!report && (
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
