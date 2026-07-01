'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, Sparkles, Database, FileSearch, Trash2, LineChart, Target, Bot } from 'lucide-react';
import PaperPreviewPanel from '@/components/pyq/PaperPreviewPanel';
import Link from 'next/link';
import PYQAssistantPanel from '@/components/pyq/PYQAssistantPanel';

type QuestionPaper = {
  id: string;
  title: string;
  year: number;
  semester: number;
  isProcessed: boolean;
  uploadType: string;
  originalFileName: string;
  filePath: string;
  createdAt: string;
  subject?: { name: string };
  _count?: { extractedQuestions: number };
  extractedQuestions?: any[];
};

export default function PYQAnalyzer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('Uploading PDF...');
  
  // Two separate workflows
  const [activeTab, setActiveTab] = useState<'historical' | 'current'>('historical');
  
  const [uploadForm, setUploadForm] = useState({ title: '', year: new Date().getFullYear().toString(), semester: '1', subjectId: '' });
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // State for the preview panel
  const [previewPaperId, setPreviewPaperId] = useState<string | null>(null);
  const [previewPaperData, setPreviewPaperData] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // Assistant Panel
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;

  const fetchPapers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/papers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPapers(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    setMounted(true); 
    fetchPapers(); 
    fetchSubjects(); 
  }, []);

  // Poll for papers that are processing
  useEffect(() => {
    const hasProcessing = papers.some(p => !p.isProcessed);
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchPapers();
    }, 5000);

    return () => clearInterval(interval);
  }, [papers]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSubjects(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleOpenPreview = async (paperId: string) => {
    setPreviewPaperId(paperId);
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`http://localhost:5000/api/teacher/pyq/papers/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPreviewPaperData(await res.json());
      }
    } catch (err) { console.error(err); }
    setIsLoadingPreview(false);
  };

  const handleDeletePaper = async (e: React.MouseEvent, paperId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this question paper? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/teacher/pyq/papers/${paperId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPapers();
    } catch (err) { console.error(err); }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !uploadForm.title) return;
    setUploading(true);
    
    // Simulate real-time status since backend is async
    const statusSequence = [
      'Checking for text layer...',
      'Running OCR...',
      'Enhancing scanned image...',
      'Extracting tables & equations...',
      'Generating embeddings...',
      'Calculating similarity...'
    ];
    let i = 0;
    const progressInterval = setInterval(() => {
      if (i < statusSequence.length) {
        setUploadProgress(statusSequence[i]);
        i++;
      }
    }, 2000);

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('title', uploadForm.title);
    formData.append('year', uploadForm.year);
    formData.append('semester', uploadForm.semester);
    if (uploadForm.subjectId) formData.append('subjectId', uploadForm.subjectId);

    const endpoint = activeTab === 'historical' ? '/bulk-upload' : '/analyze-current';

    try {
      const res = await fetch(`http://localhost:5000/api/teacher/pyq${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setUploadForm({ title: '', year: new Date().getFullYear().toString(), semester: '1', subjectId: '' });
        fetchPapers();
      }
    } catch (err) { console.error(err); }
    
    clearInterval(progressInterval);
    setUploading(false);
    setUploadProgress('Uploading PDF...');
  }, [uploadForm, token, activeTab]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: !uploadForm.title
  });

  const historicalPapers = papers.filter(p => p.uploadType === 'HISTORICAL');
  const currentPapers = papers.filter(p => p.uploadType === 'CURRENT_ANALYSIS');
  const displayedPapers = activeTab === 'historical' ? historicalPapers : currentPapers;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2">PYQ Intelligence</h1>
          <p className={`text-base max-w-3xl ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            Production-grade examination analysis engine powered by OCR and semantic RAG.
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-3">
          <Link href="/teacher/dashboard/pyq-analyzer/search" className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
            <FileSearch size={16} /> Global Search
          </Link>
          <Link href="/teacher/dashboard/pyq-analyzer/analytics" className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
            <LineChart size={16} /> Analytics
          </Link>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-2xl mb-8 w-max ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
        <button
          onClick={() => setActiveTab('historical')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'historical' ? (isDark ? 'bg-[#1a1a1c] shadow-lg text-white' : 'bg-white shadow-sm text-black') : 'opacity-60 hover:opacity-100'}`}
        >
          <Database size={16} /> Bulk Historical Database
        </button>
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'current' ? (isDark ? 'bg-[#1a1a1c] shadow-lg text-white' : 'bg-white shadow-sm text-black') : 'opacity-60 hover:opacity-100'}`}
        >
          <Target size={16} /> Current Paper Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`rounded-3xl p-6 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
          >
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <Upload size={18} className={activeTab === 'historical' ? 'text-purple-500' : 'text-blue-500'} /> 
              {activeTab === 'historical' ? 'Upload Historical PYQ' : 'Analyze Current Paper'}
            </h3>
            <p className="text-xs opacity-60 mb-5">
              {activeTab === 'historical' 
                ? 'Papers uploaded here will build the semantic database for future comparison.'
                : 'Papers uploaded here will be compared against the historical database without polluting it.'}
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-50 mb-1.5 block">Paper Title</label>
                <input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. DBMS End Semester 2024"
                  className={`w-full px-4 py-3 rounded-xl text-sm border transition-colors ${isDark ? 'bg-black/40 border-white/10 focus:border-blue-500' : 'bg-gray-50 border-black/10 focus:border-blue-400'} focus:outline-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-50 mb-1.5 block">Year</label>
                  <input
                    type="number"
                    value={uploadForm.year}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl text-sm border transition-colors ${isDark ? 'bg-black/40 border-white/10 focus:border-blue-500' : 'bg-gray-50 border-black/10 focus:border-blue-400'} focus:outline-none`}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider opacity-50 mb-1.5 block">Semester</label>
                  <select
                    value={uploadForm.semester}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl text-sm border transition-colors ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500' : 'bg-gray-50 border-black/10 text-black focus:border-blue-400'} focus:outline-none`}
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider opacity-50 mb-1.5 block">Subject Mapping</label>
                <select
                  value={uploadForm.subjectId}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl text-sm border transition-colors ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500' : 'bg-gray-50 border-black/10 text-black focus:border-blue-400'} focus:outline-none`}
                >
                  <option value="">Auto-detect / None</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
                </select>
              </div>
            </div>

            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              !uploadForm.title ? 'opacity-40 cursor-not-allowed' : ''
            } ${isDragActive ? 'border-blue-500 bg-blue-500/10' : isDark ? 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5' : 'border-black/10 hover:border-blue-500/50 hover:bg-blue-50'}`}>
              <input {...getInputProps()} />
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 size={32} className={`mx-auto animate-spin ${activeTab === 'historical' ? 'text-purple-500' : 'text-blue-500'}`} />
                  <p className={`text-sm font-medium ${activeTab === 'historical' ? 'text-purple-500' : 'text-blue-500'}`}>{uploadProgress}</p>
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'}`}>
                    <FileText size={24} />
                  </div>
                  <p className="text-sm font-medium mb-1">Upload Question Paper (PDF/Image)</p>
                  <p className="text-xs opacity-50">{uploadForm.title ? 'Drag & drop or click to browse' : 'Please enter a title first'}</p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right: Papers Database */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
             className={`rounded-3xl p-6 border h-full ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold flex items-center gap-2">
                {activeTab === 'historical' 
                  ? <><Database size={18} className="text-purple-500" /> Historical Database</>
                  : <><Target size={18} className="text-blue-500" /> Current Analyzed Papers</>}
              </h3>
            </div>
            
            {displayedPapers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <FileSearch size={48} className="mb-4" />
                <p className="text-sm font-medium">No papers found</p>
                <p className="text-xs mt-1">Upload a paper to see it listed here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedPapers.map((paper) => (
                  <div 
                    key={paper.id} 
                    onClick={() => handleOpenPreview(paper.id)}
                    className={`group relative rounded-2xl p-5 border cursor-pointer transition-all hover:-translate-y-1 ${
                      isDark ? 'bg-black/40 border-white/5 hover:border-blue-500/50 hover:bg-[#1a1a1c]' : 'bg-gray-50 border-black/5 hover:border-blue-400 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <button 
                      onClick={(e) => handleDeletePaper(e, paper.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <h4 className="font-bold text-base mb-1 pr-8 truncate">{paper.title}</h4>
                    <div className="flex items-center gap-3 text-xs opacity-60 mb-4">
                      <span>{paper.year}</span>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      <span>Semester {paper.semester}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-current border-opacity-10">
                      {paper.isProcessed ? (
                        <>
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Status</span>
                             <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
                               <Sparkles size={12} /> {paper._count?.extractedQuestions || 0} Questions
                             </span>
                          </div>
                          {(paper as any).analytics && (
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Repetition</span>
                              <span className={`text-xs font-semibold flex items-center justify-end gap-1 ${(paper as any).analytics.overallSimilarity > 50 ? 'text-orange-500' : 'text-blue-500'}`}>
                                <Target size={12} /> {Math.round((paper as any).analytics.overallSimilarity)}% Match
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Status</span>
                           <span className="text-xs font-semibold text-blue-500 flex items-center gap-1">
                             <Loader2 size={12} className="animate-spin" /> Processing AI...
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Full Screen Preview Panel */}
      {previewPaperId && (
        isLoadingPreview ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <Loader2 size={48} className="animate-spin text-blue-500" />
          </div>
        ) : previewPaperData ? (
          <PaperPreviewPanel 
            paper={previewPaperData} 
            onClose={() => { setPreviewPaperId(null); setPreviewPaperData(null); }} 
          />
        ) : null
      )}
    </div>
  );
}
