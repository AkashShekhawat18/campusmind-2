"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Upload, Brain, Loader2, FileQuestion, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeacherPYQAnalyzer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleReplaceQuestion = async (originalQ: any) => {
    try {
      const token = localStorage.getItem("teacherToken");
      const res = await fetch(`http://localhost:5000/api/pyq/replace`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ originalQuestion: originalQ })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Replacement Generated: \n\n${data.replacement.replacementText}`);
      }
    } catch (e) {
      console.error(e);
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-12 text-center border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
          <div 
            className={`border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${isDark ? 'border-white/20 hover:bg-white/5 hover:border-emerald-500/50' : 'border-black/20 hover:bg-black/5 hover:border-emerald-500/50'}`}
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
            
            <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-emerald-400" />
            </div>
            
            <h3 className="text-2xl font-semibold mb-2">
              {file ? file.name : 'Upload Current Paper'}
            </h3>
            <p className={`mb-8 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop your PDF or Camera Image here'}
            </p>
            
            <button 
              className={`flex items-center justify-center mx-auto gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all ${
                (!file || isAnalyzing) ? 'bg-emerald-600/50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20'
              }`}
              onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
              disabled={!file || isAnalyzing}
            >
              {isAnalyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing 6 Dimensions...</>
              ) : (
                <><Brain className="w-5 h-5" /> Start Professor Analysis</>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Overall Repetition</p>
              <h3 className="text-4xl font-bold text-rose-400">{report.analytics?.overallRepetitionPercent}%</h3>
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-current bg-opacity-10">
                <div className="h-full bg-rose-500" style={{ width: `${report.analytics?.overallRepetitionPercent}%` }}></div>
              </div>
            </div>
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Exact/Fully Repeated</p>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <h3 className="text-3xl font-bold">{report.analytics?.fullyRepeated}</h3>
              </div>
            </div>
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Concept Repeated</p>
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-amber-500" />
                <h3 className="text-3xl font-bold">{report.analytics?.conceptRepeated}</h3>
              </div>
            </div>
            <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <p className="text-sm font-medium mb-2 opacity-60">Fresh / New</p>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <h3 className="text-3xl font-bold">{report.analytics?.newQuestions}</h3>
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
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <FileQuestion className="w-5 h-5 opacity-50"/> 
                        Question ID: {res.sourceQuestionId.substring(0, 8)}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        res.matchType === 'EXACT' ? 'border-rose-500 text-rose-500 bg-rose-500/10' : 
                        res.matchType === 'CONCEPT_REPEATED' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 
                        'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                      }`}>
                        {res.overallSimilarity}% Match
                      </span>
                    </div>
                    
                    <div className={`p-4 rounded-lg text-sm font-mono whitespace-pre-wrap ${isDark ? 'bg-black/30' : 'bg-black/5'}`}>
                      Matched with: {res.targetQuestionId.substring(0, 8)}
                    </div>
                    
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
                          <span className="font-mono">{d.val}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden bg-current bg-opacity-10">
                          <div className="h-full bg-current opacity-50" style={{ width: `${d.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                      onClick={() => handleReplaceQuestion(res)}
                    >
                      Generate Replacement
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
