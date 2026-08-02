'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { PenTool, Plus, Trash2, GripVertical, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

interface Section {
  id: string;
  name: string;
  questionType: string;
  marksPerQuestion: number;
  questionCount: number;
}

export default function TestGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [totalTime, setTotalTime] = useState(180);
  const [sections, setSections] = useState<Section[]>([
    { id: '1', name: 'Section A', questionType: 'mcq', marksPerQuestion: 1, questionCount: 20 },
    { id: '2', name: 'Section B', questionType: 'subjective', marksPerQuestion: 5, questionCount: 5 },
    { id: '3', name: 'Section C', questionType: 'subjective', marksPerQuestion: 10, questionCount: 3 },
  ]);

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
    isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50' : 'bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-blue-500'
  }`;

  const totalMarks = sections.reduce((s, sec) => s + sec.marksPerQuestion * sec.questionCount, 0);
  const totalQuestions = sections.reduce((s, sec) => s + sec.questionCount, 0);

  const addSection = () => {
    setSections(prev => [...prev, { id: crypto.randomUUID(), name: `Section ${String.fromCharCode(65 + prev.length)}`, questionType: 'mcq', marksPerQuestion: 1, questionCount: 5 }]);
  };

  const updateSection = (id: string, field: string, value: string | number) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <PenTool size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Test Paper Generator</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Build structured test papers with sections</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className={`lg:col-span-1 rounded-2xl p-5 h-fit sticky top-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <h3 className="text-sm font-semibold mb-4">Paper Info</h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Paper Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mid-Semester Exam" className={inputClass} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics" className={inputClass} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Duration (min)</label>
              <input type="number" min={15} value={totalTime} onChange={e => setTotalTime(parseInt(e.target.value) || 180)} className={inputClass} />
            </div>

            {/* Stats */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]'}`}>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold">{totalQuestions}</div>
                  <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Questions</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{totalMarks}</div>
                  <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Total Marks</div>
                </div>
              </div>
            </div>

            <button className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-400 text-white shadow-lg shadow-rose-500/20">
              <Sparkles size={16} /> AI Generate Paper
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white/60' : 'text-black/60'}`}>Sections ({sections.length})</h3>
            <button onClick={addSection} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
              <Plus size={14} /> Add Section
            </button>
          </div>

          <div className="space-y-3">
            {sections.map((sec) => (
              <div key={sec.id} className={`rounded-2xl p-5 transition-all ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <GripVertical size={16} className="opacity-20 cursor-grab" />
                  <input type="text" value={sec.name} onChange={e => updateSection(sec.id, 'name', e.target.value)} className={`text-sm font-semibold bg-transparent border-none outline-none flex-1 ${isDark ? 'text-white' : 'text-black'}`} />
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(sec.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Type</label>
                    <select value={sec.questionType} onChange={e => updateSection(sec.id, 'questionType', e.target.value)} className={inputClass}>
                      <option value="mcq">MCQ</option>
                      <option value="subjective">Subjective</option>
                      <option value="numerical">Numerical</option>
                      <option value="coding">Coding</option>
                      <option value="true_false">True/False</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Marks Each</label>
                    <input type="number" min={1} value={sec.marksPerQuestion} onChange={e => updateSection(sec.id, 'marksPerQuestion', parseInt(e.target.value) || 1)} className={inputClass} />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Count</label>
                    <input type="number" min={1} value={sec.questionCount} onChange={e => updateSection(sec.id, 'questionCount', parseInt(e.target.value) || 1)} className={inputClass} />
                  </div>
                </div>
                <div className={`mt-3 text-xs text-right ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                  Subtotal: {sec.marksPerQuestion * sec.questionCount} marks
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
