'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Sparkles, ChevronDown, RefreshCw, Save, FileText, Loader2 } from 'lucide-react';
import { QuestionCard, type QuestionData } from '@/components/assessment/QuestionCard';
import { QuestionEditor, type EditorQuestion } from '@/components/assessment/QuestionEditor';

const questionTypeOptions = [
  { value: 'mcq', label: 'MCQs' },
  { value: 'subjective', label: 'Subjective' },
  { value: 'coding', label: 'Coding' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'case_study', label: 'Case Studies' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in Blank' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'latex', label: 'LaTeX' },
];

const bloomOptions = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

export default function AIGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq']);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');
  const [bloomLevels, setBloomLevels] = useState<string[]>(['Understand', 'Apply']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<QuestionData[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<EditorQuestion | null>(null);

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50'
      : 'bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-blue-500'
  }`;

  const toggleType = (v: string) => {
    setSelectedTypes(prev => prev.includes(v) ? prev.filter(t => t !== v) : [...prev, v]);
  };

  const toggleBloom = (v: string) => {
    setBloomLevels(prev => prev.includes(v) ? prev.filter(b => b !== v) : [...prev, v]);
  };

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    // Simulate loading — real AI will be wired in Phase 3
    setTimeout(() => {
      setIsGenerating(false);
      // No fake data generated per project rules — show informational state
    }, 1500);
  };

  const handleEditQuestion = (id: string) => {
    const q = generated.find(q => q.id === id);
    if (q) {
      setEditingQuestion({
        id: q.id, type: q.type, text: q.text, marks: q.marks,
        difficulty: q.difficulty, bloomLevel: q.bloomLevel || 'Understand',
        topic: q.topic || '', options: q.options || [], correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
      });
      setEditorOpen(true);
    }
  };

  const handleSaveEdit = (q: EditorQuestion) => {
    const updated: QuestionData = {
      id: q.id, type: q.type as QuestionData['type'], text: q.text, marks: q.marks,
      difficulty: q.difficulty as QuestionData['difficulty'], bloomLevel: q.bloomLevel,
      topic: q.topic, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation,
    };
    setGenerated(prev => prev.map(p => p.id === q.id ? updated : p));
    setEditingQuestion(null);
  };

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Wand2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Generator</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Generate assessment questions using AI
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className={`lg:col-span-1 rounded-2xl p-5 h-fit sticky top-6 ${
          isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Sparkles size={16} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
            Generation Config
          </h3>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Topic *</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Binary Search Trees" className={inputClass} />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Data Structures" className={inputClass} />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Question Types</label>
              <div className="flex flex-wrap gap-2">
                {questionTypeOptions.map(t => (
                  <button
                    key={t.value}
                    onClick={() => toggleType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedTypes.includes(t.value)
                        ? (isDark ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-violet-50 text-violet-600 border border-violet-200')
                        : (isDark ? 'bg-white/5 text-white/40 border border-white/5' : 'bg-black/5 text-black/40 border border-black/5')
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Count</label>
                <input type="number" min={1} max={50} value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value) || 10)} className={inputClass} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={inputClass}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Bloom&apos;s Taxonomy</label>
              <div className="flex flex-wrap gap-2">
                {bloomOptions.map(b => (
                  <button
                    key={b}
                    onClick={() => toggleBloom(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bloomLevels.includes(b)
                        ? (isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-200')
                        : (isDark ? 'bg-white/5 text-white/40 border border-white/5' : 'bg-black/5 text-black/40 border border-black/5')
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-400 text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Wand2 size={16} /> Generate Questions</>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {generated.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>{generated.length} questions generated</span>
                <div className="flex gap-2">
                  <button onClick={handleGenerate} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
                    <RefreshCw size={14} /> Regenerate All
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                    <Save size={14} /> Save to Assessment
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {generated.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    onEdit={handleEditQuestion}
                    onDelete={(id) => setGenerated(prev => prev.filter(p => p.id !== id))}
                    onDuplicate={(id) => {
                      const orig = generated.find(q => q.id === id);
                      if (orig) setGenerated(prev => [...prev, { ...orig, id: crypto.randomUUID() }]);
                    }}
                    onRegenerate={() => {/* Phase 3 */}}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={`rounded-2xl p-12 text-center ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
              <div className={`w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                <Wand2 size={32} className={isDark ? 'text-violet-400/50' : 'text-violet-600/50'} />
              </div>
              <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {isGenerating ? 'Generating questions...' : 'Ready to generate'}
              </h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-white/25' : 'text-black/25'}`}>
                {isGenerating
                  ? 'AI is creating questions based on your configuration. AI generation will be fully connected in a future update.'
                  : 'Configure your preferences on the left and click "Generate Questions" to create AI-powered assessment questions.'
                }
              </p>
              {isGenerating && (
                <Loader2 size={24} className={`mx-auto mt-4 animate-spin ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              )}
            </div>
          )}
        </div>
      </div>

      <QuestionEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingQuestion(null); }}
        onSave={handleSaveEdit}
        initialData={editingQuestion}
      />
    </div>
  );
}
