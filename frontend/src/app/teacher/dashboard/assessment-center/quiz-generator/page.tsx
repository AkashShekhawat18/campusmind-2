'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Sparkles, Loader2 } from 'lucide-react';
import { QuestionCard, type QuestionData } from '@/components/assessment/QuestionCard';
import { QuestionEditor, type EditorQuestion } from '@/components/assessment/QuestionEditor';
import { EmptyState } from '@/components/assessment/EmptyState';

export default function QuizGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<EditorQuestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
    isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50' : 'bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-blue-500'
  }`;

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const handleSaveQuestion = (q: EditorQuestion) => {
    const newQ: QuestionData = {
      id: q.id, type: q.type as QuestionData['type'], text: q.text, marks: q.marks,
      difficulty: q.difficulty as QuestionData['difficulty'], bloomLevel: q.bloomLevel,
      topic: q.topic, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation,
    };
    if (editingQuestion) {
      setQuestions(prev => prev.map(p => p.id === q.id ? newQ : p));
    } else {
      setQuestions(prev => [...prev, newQ]);
    }
    setEditingQuestion(null);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return alert('Please enter a topic');
    
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('teacherToken');
      const res = await fetch('http://localhost:5000/api/assessment/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, questionCount })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      } else {
        alert('Failed to generate quiz');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <HelpCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quiz Generator</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Quick quiz creation with AI or manual questions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className={`lg:col-span-1 rounded-2xl p-5 h-fit sticky top-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <h3 className="text-sm font-semibold mb-4">Quiz Settings</h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Quiz Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 3 Quiz" className={inputClass} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Topic</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Linked Lists" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Questions</label>
                <input type="number" min={1} value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value) || 10)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Time (min)</label>
                <input type="number" min={5} value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || 30)} className={inputClass} />
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all hover:shadow-amber-500/30"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGenerating ? 'Generating...' : 'AI Generate Quiz'}
            </button>

            <div className={`text-center text-xs ${isDark ? 'text-white/20' : 'text-black/20'}`}>or</div>

            <button
              onClick={() => { setEditingQuestion(null); setEditorOpen(true); }}
              className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium border ${isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-black/10 text-black/60 hover:bg-black/5'}`}
            >
              <Plus size={16} /> Add Question Manually
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          {questions.length > 0 ? (
            <div>
              <div className={`flex items-center justify-between mb-4 text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                <span>{questions.length} questions · {totalMarks} marks · {timeLimit} min</span>
              </div>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionCard key={q.id} question={q} index={i}
                    onEdit={(id) => { const q = questions.find(q => q.id === id); if (q) { setEditingQuestion({ id: q.id, type: q.type, text: q.text, marks: q.marks, difficulty: q.difficulty, bloomLevel: q.bloomLevel || 'Understand', topic: q.topic || '', options: q.options || [], correctAnswer: q.correctAnswer || '', explanation: q.explanation || '' }); setEditorOpen(true); }}}
                    onDelete={(id) => setQuestions(prev => prev.filter(p => p.id !== id))}
                    onDuplicate={(id) => { const o = questions.find(q => q.id === id); if (o) setQuestions(prev => [...prev, { ...o, id: crypto.randomUUID() }]); }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={HelpCircle} title="No questions added" description="Use AI to generate quiz questions or add them manually from the panel on the left." />
          )}
        </div>
      </div>

      <QuestionEditor isOpen={editorOpen} onClose={() => { setEditorOpen(false); setEditingQuestion(null); }} onSave={handleSaveQuestion} initialData={editingQuestion} />
    </div>
  );
}
