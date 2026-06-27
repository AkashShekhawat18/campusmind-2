import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { X, Sparkles, BookOpen, Loader2, GitCompare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
interface QuestionComparisonViewProps {
  currentQuestion: any;
  historicalMatch: any;
  onClose: () => void;
}

export default function QuestionComparisonView({ currentQuestion, historicalMatch, onClose }: QuestionComparisonViewProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = typeof window !== 'undefined' ? resolvedTheme === 'dark' : true;

  const [rewrittenText, setRewrittenText] = useState<string | null>(null);
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'rewrite' | 'answer' | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;

  const handleRewrite = async () => {
    setLoadingAction('rewrite');
    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          question: currentQuestion.questionText, 
          marks: currentQuestion.marks, 
          topic: currentQuestion.topic 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRewrittenText(data.rewritten);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingAction(null);
  };

  const handleModelAnswer = async () => {
    setLoadingAction('answer');
    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          questionId: currentQuestion.id,
          question: currentQuestion.questionText, 
          format: 'DETAILED'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setModelAnswer(data.answer);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingAction(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#1a1a1c] border border-white/10' : 'bg-white border border-black/10'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <GitCompare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Similarity Comparison</h2>
              <p className="text-xs opacity-60">
                {historicalMatch.similarityScore}% {historicalMatch.matchType} Match
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg opacity-50 hover:opacity-100 bg-white/5">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Current Question */}
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider opacity-50">Current Question</span>
              </div>
              <div className="text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentQuestion.questionText}
                </ReactMarkdown>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <button 
                  onClick={handleRewrite}
                  disabled={!!loadingAction}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isDark ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  {loadingAction === 'rewrite' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Rewrite with AI
                </button>
                <button 
                  onClick={handleModelAnswer}
                  disabled={!!loadingAction}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {loadingAction === 'answer' ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                  Generate Model Answer
                </button>
              </div>
            </div>

            {/* Right: Historical Question */}
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Historical Match</span>
              </div>
              <div className="text-sm leading-relaxed opacity-80">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {historicalMatch.matchedQuestion?.questionText || ''}
                </ReactMarkdown>
              </div>
              <div className="mt-6 pt-4 border-t border-current border-opacity-10">
                <p className="text-[11px] uppercase font-bold tracking-wider opacity-50 mb-1">Found In</p>
                <p className="text-sm font-medium">{historicalMatch.matchedPaperTitle}</p>
                <p className="text-xs opacity-60">Year: {historicalMatch.matchedYear} | Subject: {historicalMatch.matchedSubject}</p>
              </div>
            </div>
          </div>

          {/* AI Generations Section */}
          {(rewrittenText || modelAnswer) && (
            <div className="mt-6 space-y-4">
              {rewrittenText && (
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                   <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-purple-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-500">AI Rewritten Question</span>
                  </div>
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {rewrittenText}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {modelAnswer && (
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#111113] border-blue-500/30' : 'bg-white border-blue-200 shadow-sm'}`}>
                   <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                    <BookOpen size={16} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-500">AI Model Answer</span>
                  </div>
                  <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{modelAnswer}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}
