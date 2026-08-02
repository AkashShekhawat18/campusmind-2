'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, GripVertical } from 'lucide-react';

interface QuestionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: EditorQuestion) => void;
  initialData?: EditorQuestion | null;
}

export interface EditorQuestion {
  id: string;
  type: string;
  text: string;
  marks: number;
  difficulty: string;
  bloomLevel: string;
  topic: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
}

const questionTypes = [
  'mcq', 'subjective', 'coding', 'numerical', 'true_false',
  'fill_blank', 'case_study', 'diagram', 'latex',
];

const typeLabels: Record<string, string> = {
  mcq: 'Multiple Choice', subjective: 'Subjective', coding: 'Coding',
  numerical: 'Numerical', true_false: 'True/False', fill_blank: 'Fill in Blank',
  case_study: 'Case Study', diagram: 'Diagram', latex: 'LaTeX',
};

const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

const defaultQuestion: EditorQuestion = {
  id: '', type: 'mcq', text: '', marks: 1, difficulty: 'medium',
  bloomLevel: 'Understand', topic: '',
  options: [
    { id: 'a', text: '', isCorrect: true },
    { id: 'b', text: '', isCorrect: false },
    { id: 'c', text: '', isCorrect: false },
    { id: 'd', text: '', isCorrect: false },
  ],
  correctAnswer: '', explanation: '',
};

export function QuestionEditor({ isOpen, onClose, onSave, initialData }: QuestionEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [question, setQuestion] = useState<EditorQuestion>(initialData || { ...defaultQuestion, id: crypto.randomUUID() });

  useEffect(() => {
    if (isOpen) {
      setQuestion(initialData || { ...defaultQuestion, id: crypto.randomUUID() });
    }
  }, [isOpen, initialData]);

  const updateField = (field: string, value: unknown) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (optId: string, field: string, value: unknown) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.map(o =>
        o.id === optId
          ? { ...o, [field]: value }
          : field === 'isCorrect' && value === true
            ? { ...o, isCorrect: false }
            : o
      ),
    }));
  };

  const addOption = () => {
    const id = String.fromCharCode(97 + question.options.length);
    setQuestion(prev => ({
      ...prev,
      options: [...prev.options, { id, text: '', isCorrect: false }],
    }));
  };

  const removeOption = (optId: string) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.filter(o => o.id !== optId),
    }));
  };

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border transition-colors ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50'
      : 'bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-blue-500'
  } outline-none`;

  const selectClass = inputClass;

  const handleSave = () => {
    if (!question.text.trim()) return;
    onSave(question);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 shadow-2xl ${
              isDark ? 'bg-[#16161a] border border-white/10' : 'bg-white border border-black/10'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{initialData ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type + Difficulty row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Question Type</label>
                  <select value={question.type} onChange={e => updateField('type', e.target.value)} className={selectClass}>
                    {questionTypes.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Difficulty</label>
                  <select value={question.difficulty} onChange={e => updateField('difficulty', e.target.value)} className={selectClass}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Marks + Bloom + Topic */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Marks</label>
                  <input type="number" min={1} value={question.marks} onChange={e => updateField('marks', parseInt(e.target.value) || 1)} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Bloom&apos;s Level</label>
                  <select value={question.bloomLevel} onChange={e => updateField('bloomLevel', e.target.value)} className={selectClass}>
                    {bloomLevels.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Topic</label>
                  <input type="text" value={question.topic} onChange={e => updateField('topic', e.target.value)} placeholder="e.g. Thermodynamics" className={inputClass} />
                </div>
              </div>

              {/* Question text */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Question Text</label>
                <textarea
                  rows={3}
                  value={question.text}
                  onChange={e => updateField('text', e.target.value)}
                  placeholder="Enter your question..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* MCQ Options */}
              {question.type === 'mcq' && (
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Options</label>
                  <div className="space-y-2">
                    {question.options.map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          onClick={() => updateOption(opt.id, 'isCorrect', true)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border transition-all ${
                            opt.isCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : (isDark ? 'border-white/10 text-white/40 hover:border-white/30' : 'border-black/10 text-black/40 hover:border-black/30')
                          }`}
                        >
                          {opt.isCorrect ? <Check size={12} /> : String.fromCharCode(65 + i)}
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={e => updateOption(opt.id, 'text', e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className={`flex-1 ${inputClass}`}
                        />
                        {question.options.length > 2 && (
                          <button onClick={() => removeOption(opt.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {question.options.length < 6 && (
                    <button onClick={addOption} className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-xs font-medium ${isDark ? 'text-white/40 hover:bg-white/5' : 'text-black/40 hover:bg-black/5'}`}>
                      <Plus size={14} /> Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Answer for non-MCQ */}
              {question.type !== 'mcq' && (
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    {question.type === 'true_false' ? 'Correct Answer' : 'Expected Answer / Solution'}
                  </label>
                  {question.type === 'true_false' ? (
                    <select value={question.correctAnswer} onChange={e => updateField('correctAnswer', e.target.value)} className={selectClass}>
                      <option value="">Select</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  ) : (
                    <textarea
                      rows={2}
                      value={question.correctAnswer}
                      onChange={e => updateField('correctAnswer', e.target.value)}
                      placeholder="Enter expected answer or solution..."
                      className={`${inputClass} resize-none`}
                    />
                  )}
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Explanation (optional)</label>
                <textarea
                  rows={2}
                  value={question.explanation}
                  onChange={e => updateField('explanation', e.target.value)}
                  placeholder="Explain the answer..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'text-white/60 hover:bg-white/5' : 'text-black/60 hover:bg-black/5'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!question.text.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {initialData ? 'Save Changes' : 'Add Question'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
