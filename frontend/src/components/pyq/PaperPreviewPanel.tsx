import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { FileText, Loader2, ChevronDown, ChevronUp, Sparkles, AlertCircle, Copy, BookOpen, Bot } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import QuestionComparisonView from './QuestionComparisonView';
import PYQAssistantPanel from './PYQAssistantPanel';

interface PaperPreviewPanelProps {
  paper: any;
  onClose: () => void;
}

export default function PaperPreviewPanel({ paper, onClose }: PaperPreviewPanelProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [chatOpen, setChatOpen] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [comparingQ, setComparingQ] = useState<any | null>(null);
  const [activeGeneration, setActiveGeneration] = useState<any>(null);

  const handleGenerateReplacement = async (q: any) => {
    setActiveGeneration({ question: q, rewrittenText: null, loading: true });
    try {
      const token = localStorage.getItem('teacherToken');
      const res = await fetch('http://localhost:5000/api/teacher/pyq/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          question: q.questionText, 
          marks: q.marks, 
          topic: q.topic 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveGeneration({ question: q, rewrittenText: data.rewritten, loading: false });
      } else {
        setActiveGeneration({ question: q, rewrittenText: 'Failed to generate.', loading: false });
      }
    } catch (err) {
      console.error(err);
      setActiveGeneration({ question: q, rewrittenText: 'Error generating replacement.', loading: false });
    }
  };
  
  // Extract relative path from absolute DB path (e.g. D:\Campusmind2.0\backend\uploads\pyq\...)
  const getRelativeUrl = (filePath: string) => {
    if (!filePath) return '';
    const normalized = filePath.replace(/\\/g, '/');
    const uploadsIndex = normalized.indexOf('uploads/');
    if (uploadsIndex !== -1) {
      return `/${normalized.substring(uploadsIndex)}`;
    }
    return `/${normalized}`;
  };

  const fileUrl = getRelativeUrl(paper.filePath);
  const isImage = fileUrl.match(/\.(jpeg|jpg|png|webp)$/i);

  const getSimilarityColor = (score: number) => {
    if (score >= 85) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  return (
    <div className="flex flex-col h-screen fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 lg:p-8">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 rounded-t-2xl border-b border-white/10 ${isDark ? 'bg-[#1a1a1c]' : 'bg-white'}`}>
        <div>
          <h2 className="text-xl font-bold">{paper.title}</h2>
          <p className="text-xs opacity-60">Year: {paper.year} | Sem: {paper.semester} | Questions: {paper.extractedQuestions?.length || 0}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20">
            Close Panel
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className={`flex-1 flex overflow-hidden rounded-b-2xl border border-white/10 ${isDark ? 'bg-[#111113]' : 'bg-gray-50'}`}>
        
        {/* Left Pane: Previewer */}
        <div className="w-1/3 border-r border-white/10 relative bg-black flex items-center justify-center overflow-hidden">
          {isImage ? (
            <img src={fileUrl} alt="Question Paper" className="max-w-full max-h-full object-contain" />
          ) : (
            <iframe 
              src={`${fileUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-none"
              title="PDF Preview"
            />
          )}
        </div>

        {/* Middle Pane: Questions List */}
        <div className="w-1/3 overflow-y-auto p-6 space-y-4 border-r border-white/10">
          {!paper.isProcessed ? (
             <div className="flex flex-col items-center justify-center h-full text-center">
               <Loader2 size={48} className="animate-spin text-blue-400 mb-4" />
               <h3 className="text-lg font-semibold mb-2">Processing...</h3>
               <p className="opacity-60 text-sm">Extracting questions and generating embeddings for similarity match.</p>
             </div>
          ) : (
            paper.extractedQuestions?.map((q: any) => {
              const hasSimilarity = q.similarityAsSource && q.similarityAsSource.length > 0;
              const highestSim = hasSimilarity ? Math.max(...q.similarityAsSource.map((s: any) => s.similarityScore)) : 0;

              return (
                <div key={q.id} className={`rounded-2xl p-5 border transition-colors hover:border-blue-500/30 ${isDark ? 'bg-[#1a1a1c] border-white/5' : 'bg-white border-black/5'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                      Q{q.questionNumber || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={q.questionText} messageId={`q-${q.id}`} />
                      </div>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {q.marks && <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>{q.marks} MARKS</span>}
                        {q.topic && <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{q.topic}</span>}
                        {hasSimilarity && (
                          <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-wider border ${getSimilarityColor(highestSim)}`}>
                            {Math.round(highestSim)}% SIMILAR
                          </span>
                        )}
                      </div>

                      {/* Similarity matches */}
                      {hasSimilarity && (
                        <div className="mt-4 space-y-2">
                          <button
                            onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                            className={`text-xs flex items-center gap-1 font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                          >
                            {expandedQ === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {q.similarityAsSource.length} Historical Matches Found
                          </button>
                          
                          <AnimatePresence>
                            {expandedQ === q.id && q.similarityAsSource.map((sim: any) => (
                              <motion.div key={sim.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className={`text-xs p-4 rounded-xl border mt-2 space-y-2 ${isDark ? 'bg-black/40 border-white/5' : 'bg-gray-50 border-black/5'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getSimilarityColor(sim.similarityScore)}`}>
                                    {Math.round(sim.similarityScore)}% {sim.matchType}
                                  </span>
                                  <span className="opacity-50 flex items-center gap-1 text-[10px]">
                                    <BookOpen size={10} /> {sim.matchedPaperTitle || 'Unknown Paper'} ({sim.matchedYear || 'N/A'})
                                  </span>
                                </div>
                                <p className="opacity-70 line-clamp-2 leading-relaxed">{sim.matchedQuestion?.questionText}</p>
                                
                                <button 
                                  onClick={() => setComparingQ({ current: q, historical: sim })}
                                  className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider mt-2 transition-colors ${
                                    isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                                  }`}
                                >
                                  Compare Side-by-Side
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                      
                      {/* AI Generate Button (Always visible per question) */}
                      <div className="mt-4 pt-4 border-t border-current border-opacity-10">
                         <button 
                           onClick={() => handleGenerateReplacement(q)}
                           className={`w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg transition-colors ${isDark ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                         >
                           <Sparkles size={14} /> Generate AI Replacement
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Pane: AI Workspace */}
        <div className={`w-1/3 overflow-y-auto p-6 ${isDark ? 'bg-[#111113]' : 'bg-white'}`}>
          <div className="flex items-center gap-2 mb-6">
             <Sparkles size={18} className="text-purple-500" />
             <h3 className="font-bold">AI Replacement Workspace</h3>
          </div>
          
          {!activeGeneration ? (
             <div className="flex flex-col items-center justify-center h-[50%] opacity-40 text-center">
                <Bot size={48} className="mb-4" />
                <p className="text-sm font-medium">No active generation</p>
                <p className="text-xs mt-1">Click "Generate AI Replacement" on any question.</p>
             </div>
          ) : (
             <div className="space-y-6">
               <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                 <h4 className="text-[10px] uppercase font-bold tracking-wider opacity-50 mb-2">Original Question</h4>
                 <div className="text-xs leading-relaxed opacity-80 prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={activeGeneration.question.questionText} messageId="active-gen-q" />
                 </div>
               </div>

               <div className={`p-5 rounded-2xl border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                 <h4 className="text-[10px] uppercase font-bold tracking-wider text-purple-500 mb-3">AI Generated Replacement</h4>
                 {activeGeneration.loading ? (
                    <div className="flex items-center gap-3 text-sm text-purple-500">
                       <Loader2 size={16} className="animate-spin" />
                       Generating new question...
                    </div>
                 ) : (
                    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                       <MarkdownRenderer content={activeGeneration.rewrittenText} messageId="active-gen-r" />
                    </div>
                 )}
               </div>
             </div>
          )}
        </div>

      </div>

      {/* Floating Ask PYQ AI Button for this paper */}
      <button 
        onClick={() => setChatOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-105 z-40 flex items-center gap-2"
      >
        <Bot size={24} />
        <span className="font-bold pr-2">Ask Paper AI</span>
      </button>

      {/* AI Assistant Panel */}
      {chatOpen && (
        <PYQAssistantPanel paperId={paper.id} onClose={() => setChatOpen(false)} />
      )}

      {comparingQ && (
        <QuestionComparisonView 
          currentQuestion={comparingQ.current} 
          historicalMatch={comparingQ.historical}
          onClose={() => setComparingQ(null)} 
        />
      )}
    </div>
  );
}
