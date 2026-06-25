'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, Loader2, CheckCircle2, AlertTriangle,
  RefreshCw, MessageSquare, Send, Bot, ChevronDown, ChevronUp,
  Sparkles, X
} from 'lucide-react';

type QuestionPaper = {
  id: string;
  title: string;
  year: number;
  semester: number;
  isProcessed: boolean;
  originalFileName: string;
  createdAt: string;
  subject?: { name: string };
  _count?: { extractedQuestions: number };
};

type ExtractedQuestion = {
  id: string;
  questionText: string;
  questionNumber: string;
  marks: number | null;
  topic: string | null;
  similarityAsSource: any[];
};

export default function PYQAnalyzer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', year: new Date().getFullYear().toString(), semester: '1', subjectId: '' });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [rewrittenText, setRewrittenText] = useState<Record<string, string>>({});
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // QP Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;

  useEffect(() => { setMounted(true); fetchPapers(); fetchSubjects(); }, []);

  const fetchPapers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/papers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setPapers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSubjects(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPaperDetail = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/teacher/pyq/papers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPaper(data);
        setChatMessages([]);
      }
    } catch (err) { console.error(err); }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !uploadForm.title) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('title', uploadForm.title);
    formData.append('year', uploadForm.year);
    formData.append('semester', uploadForm.semester);
    if (uploadForm.subjectId) formData.append('subjectId', uploadForm.subjectId);

    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setUploadForm({ title: '', year: new Date().getFullYear().toString(), semester: '1', subjectId: '' });
        fetchPapers();
      }
    } catch (err) { console.error(err); }
    setUploading(false);
  }, [uploadForm, token]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: !uploadForm.title
  });

  const handleRewrite = async (questionId: string, questionText: string, marks: number | null, topic: string | null) => {
    setRewriting(questionId);
    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: questionText, marks, topic })
      });
      if (res.ok) {
        const data = await res.json();
        setRewrittenText(prev => ({ ...prev, [questionId]: data.rewritten }));
      }
    } catch (err) { console.error(err); }
    setRewriting(null);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !selectedPaper) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paperId: selectedPaper.id, message: userMsg.content, history: chatMessages })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) { console.error(err); }
    setChatLoading(false);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 85) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">PYQ Analyzer</h1>
        <p className={`text-sm mb-8 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Upload question papers, detect similarity, and generate alternatives with AI.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload + Paper List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upload Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`rounded-2xl p-5 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Upload size={16} className="text-blue-400" /> Upload Question Paper
            </h3>
            <div className="space-y-3 mb-4">
              <input
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Paper title (e.g. DBMS Mid-Sem 2024)"
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:outline-none focus:border-blue-500`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={uploadForm.year}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="Year"
                  className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:outline-none`}
                />
                <select
                  value={uploadForm.semester}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                  className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'} focus:outline-none`}
                >
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <select
                value={uploadForm.subjectId}
                onChange={(e) => setUploadForm(prev => ({ ...prev, subjectId: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'} focus:outline-none`}
              >
                <option value="">Select Subject (Optional)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} - {s.department}</option>)}
              </select>
            </div>

            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              !uploadForm.title ? 'opacity-40 cursor-not-allowed' : ''
            } ${isDragActive ? 'border-blue-500 bg-blue-500/10' : isDark ? 'border-white/10 hover:border-blue-500/50' : 'border-black/10 hover:border-blue-500/50'}`}>
              <input {...getInputProps()} />
              {uploading ? (
                <Loader2 size={24} className="mx-auto animate-spin text-blue-400" />
              ) : (
                <>
                  <FileText size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs opacity-60">{uploadForm.title ? 'Drop PDF or click to upload' : 'Enter title first'}</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Paper List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`rounded-2xl p-5 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
          >
            <h3 className="text-sm font-semibold mb-4">Uploaded Papers</h3>
            {papers.length === 0 ? (
              <div className={`text-center py-6 text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                <FileText size={24} className="mx-auto mb-2 opacity-30" />
                No papers uploaded yet
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {papers.map(paper => (
                  <button
                    key={paper.id}
                    onClick={() => fetchPaperDetail(paper.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors text-sm ${
                      selectedPaper?.id === paper.id
                        ? (isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200')
                        : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')
                    }`}
                  >
                    <div className="font-medium truncate">{paper.title}</div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {paper.year} • Sem {paper.semester} • {paper.isProcessed ? `${paper._count?.extractedQuestions || 0} questions` : '⏳ Processing...'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {!selectedPaper ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`rounded-2xl p-12 border text-center ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
            >
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2 opacity-60">Select a paper to view analysis</h3>
              <p className={`text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                Upload a question paper and click on it to see extracted questions and similarity results.
              </p>
            </motion.div>
          ) : !selectedPaper.isProcessed ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`rounded-2xl p-12 border text-center ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
            >
              <Loader2 size={48} className="mx-auto mb-4 animate-spin text-blue-400" />
              <h3 className="text-lg font-semibold mb-2">Processing...</h3>
              <p className={`text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                AI is extracting questions and analyzing similarities. This may take a minute.
              </p>
              <button onClick={() => fetchPaperDetail(selectedPaper.id)} className="mt-4 text-blue-400 text-sm hover:underline flex items-center gap-1 mx-auto">
                <RefreshCw size={14} /> Refresh
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Paper Header */}
              <div className={`rounded-2xl p-5 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedPaper.title}</h2>
                    <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {selectedPaper.year} • Semester {selectedPaper.semester} • {selectedPaper.extractedQuestions?.length || 0} questions extracted
                    </p>
                  </div>
                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <MessageSquare size={16} />
                    Ask AI about this paper
                  </button>
                </div>
              </div>

              {/* Questions */}
              {selectedPaper.extractedQuestions?.map((q: ExtractedQuestion) => {
                const hasSimilarity = q.similarityAsSource && q.similarityAsSource.length > 0;
                const highestSim = hasSimilarity ? Math.max(...q.similarityAsSource.map((s: any) => s.similarityScore)) : 0;

                return (
                  <div key={q.id} className={`rounded-2xl p-5 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        Q{q.questionNumber || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{q.questionText}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {q.marks && <span className={`text-xs px-2 py-0.5 rounded-md ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>{q.marks} marks</span>}
                          {q.topic && <span className={`text-xs px-2 py-0.5 rounded-md ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{q.topic}</span>}
                          {hasSimilarity && (
                            <span className={`text-xs px-2 py-0.5 rounded-md border ${getSimilarityColor(highestSim)}`}>
                              {highestSim}% similar
                            </span>
                          )}
                        </div>

                        {/* Similarity Details */}
                        {hasSimilarity && (
                          <div className="mt-3 space-y-2">
                            <button
                              onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                              className={`text-xs flex items-center gap-1 ${isDark ? 'text-white/40 hover:text-white/70' : 'text-black/40 hover:text-black/70'}`}
                            >
                              {expandedQ === q.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              {q.similarityAsSource.length} match(es) found
                            </button>
                            <AnimatePresence>
                              {expandedQ === q.id && q.similarityAsSource.map((sim: any) => (
                                <motion.div key={sim.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                  className={`text-xs p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSimilarityColor(sim.similarityScore)}`}>
                                      {sim.similarityScore}% {sim.matchType}
                                    </span>
                                    {sim.matchedPaperTitle && <span className="opacity-50">{sim.matchedPaperTitle} ({sim.matchedYear})</span>}
                                  </div>
                                  <p className="opacity-60 mt-1">{sim.matchedQuestion?.questionText}</p>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Rewrite Button */}
                        {hasSimilarity && highestSim >= 40 && (
                          <div className="mt-3">
                            {rewrittenText[q.id] ? (
                              <div className={`p-3 rounded-xl text-sm ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Sparkles size={14} className="text-green-400" />
                                  <span className="text-xs font-semibold text-green-400">AI Alternative:</span>
                                </div>
                                <p className="opacity-80">{rewrittenText[q.id]}</p>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRewrite(q.id, q.questionText, q.marks, q.topic)}
                                disabled={rewriting === q.id}
                                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                  isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                {rewriting === q.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                Generate Alternative
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* QP Chatbot */}
              <AnimatePresence>
                {chatOpen && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
                  >
                    <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                      <div className="flex items-center gap-2">
                        <Bot size={16} className="text-blue-400" />
                        <span className="text-sm font-medium">Question Paper Chatbot</span>
                      </div>
                      <button onClick={() => setChatOpen(false)}><X size={16} className="opacity-40 hover:opacity-100" /></button>
                    </div>
                    <div className="h-[300px] overflow-y-auto p-4 space-y-3">
                      {chatMessages.length === 0 && (
                        <div className={`text-center py-8 text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                          Ask anything about this question paper
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                            msg.role === 'user'
                              ? (isDark ? 'bg-[#2a2a2c]' : 'bg-[#e4e4eb]')
                              : (isDark ? 'border border-white/10' : 'bg-white border border-black/5')
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex gap-1 px-4 py-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 p-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Ask about this paper..."
                        className="flex-1 bg-transparent border-none outline-none text-sm px-2"
                      />
                      <button onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading}
                        className={`p-2 rounded-lg ${chatInput.trim() ? 'bg-blue-500 text-white' : 'opacity-30'}`}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
