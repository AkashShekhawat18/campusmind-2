'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, ChevronRight, ChevronLeft, Check, FileText,
  Calendar, Users, Eye, Save, Send, Plus, HelpCircle, PenTool,
  BookCheck, Code2, ClipboardList, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QuestionCard, type QuestionData } from '@/components/assessment/QuestionCard';
import { QuestionEditor, type EditorQuestion } from '@/components/assessment/QuestionEditor';

const steps = [
  { label: 'Type & Info', icon: ClipboardList },
  { label: 'Questions', icon: FileText },
  { label: 'Deadline', icon: Calendar },
  { label: 'Assign', icon: Users },
  { label: 'Review', icon: Eye },
];

const assessmentTypes = [
  { value: 'quiz', label: 'Quiz', icon: HelpCircle, desc: 'MCQs, true/false, short answers', color: 'from-violet-500 to-purple-400' },
  { value: 'test', label: 'Test Paper', icon: PenTool, desc: 'Multi-section examinations', color: 'from-blue-500 to-cyan-400' },
  { value: 'assignment', label: 'Assignment', icon: BookCheck, desc: 'Homework, projects, reports', color: 'from-emerald-500 to-green-400' },
  { value: 'coding', label: 'Coding', icon: Code2, desc: 'Programming challenges', color: 'from-orange-500 to-amber-400' },
];

export default function CreateAssessmentPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [currentStep, setCurrentStep] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<EditorQuestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Step 1: Type & Info
  const [assessmentType, setAssessmentType] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [totalTime, setTotalTime] = useState(60);

  // Step 2: Questions
  const [questions, setQuestions] = useState<QuestionData[]>([]);

  // Step 3: Deadline
  const [openDate, setOpenDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [allowLate, setAllowLate] = useState(false);
  const [latePenalty, setLatePenalty] = useState(10);
  const [autoPublish, setAutoPublish] = useState(false);
  const [autoClose, setAutoClose] = useState(true);

  // Step 4: Assign
  const [assignMode, setAssignMode] = useState<'class' | 'students' | 'groups'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50'
      : 'bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-blue-500'
  }`;

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const handleAddQuestion = (q: EditorQuestion) => {
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

  const handleEditQuestion = (id: string) => {
    const q = questions.find(q => q.id === id);
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

  const canProceed = () => {
    if (currentStep === 0) return assessmentType && title.trim();
    if (currentStep === 1) return questions.length > 0;
    if (currentStep === 2) return dueDate;
    return true;
  };

  const handlePublish = async (isDraft = false) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('teacherToken');
      if (!token) {
        alert('Please log in first');
        return;
      }

      const payload = {
        title,
        description,
        type: assessmentType,
        subject,
        timeLimit: totalTime,
        totalMarks,
        openDate: openDate || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        allowLate,
        latePenalty,
        autoPublish: isDraft ? false : autoPublish,
        autoClose,
        assignMode,
        class: selectedClass,
        section: selectedSection,
        questions
      };

      const res = await fetch('http://localhost:5000/api/assessment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save assessment');
      }

      // Route to correct list view based on status
      if (isDraft) {
        router.push('/teacher/dashboard/assessment-center/drafts');
      } else if (autoPublish && openDate && new Date(openDate) > new Date()) {
        router.push('/teacher/dashboard/assessment-center/scheduled');
      } else {
        router.push('/teacher/dashboard/assessment-center/active');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <PlusCircle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Assessment</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Build your assessment step by step
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <div key={i} className="flex items-center">
              <button
                onClick={() => i < currentStep && setCurrentStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20'
                    : isCompleted
                      ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                      : (isDark ? 'bg-white/5 text-white/30' : 'bg-black/5 text-black/30')
                }`}
              >
                {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                {step.label}
              </button>
              {i < steps.length - 1 && <ChevronRight size={14} className="mx-1 opacity-20" />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1: Type & Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Assessment Type</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {assessmentTypes.map((t) => {
                    const Icon = t.icon;
                    const selected = assessmentType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setAssessmentType(t.value)}
                        className={`relative text-left rounded-2xl p-4 transition-all border ${
                          selected
                            ? (isDark ? 'border-blue-500/50 bg-blue-500/10' : 'border-blue-500 bg-blue-50')
                            : (isDark ? 'border-white/5 bg-white/5 hover:border-white/10' : 'border-black/5 bg-white hover:border-black/10')
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${t.color} flex items-center justify-center mb-3 shadow-lg`}>
                          <Icon size={18} className="text-white" />
                        </div>
                        <h4 className="text-sm font-semibold">{t.label}</h4>
                        <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mid-Term Quiz - Data Structures" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Computer Science" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this assessment..." className={`${inputClass} resize-none`} />
              </div>

              <div className="w-48">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Time Limit (minutes)</label>
                <input type="number" min={5} value={totalTime} onChange={e => setTotalTime(parseInt(e.target.value) || 60)} className={inputClass} />
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    {questions.length} questions · {totalMarks} marks
                  </span>
                </div>
                <button
                  onClick={() => { setEditingQuestion(null); setEditorOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20"
                >
                  <Plus size={16} /> Add Question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className={`rounded-2xl p-10 text-center ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                  <FileText size={40} className={`mx-auto mb-4 ${isDark ? 'text-white/15' : 'text-black/15'}`} />
                  <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>No questions added</h3>
                  <p className={`text-sm ${isDark ? 'text-white/25' : 'text-black/25'}`}>Click &quot;Add Question&quot; to start building your assessment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={i}
                      onEdit={handleEditQuestion}
                      onDelete={(id) => setQuestions(prev => prev.filter(p => p.id !== id))}
                      onDuplicate={(id) => {
                        const orig = questions.find(q => q.id === id);
                        if (orig) setQuestions(prev => [...prev, { ...orig, id: crypto.randomUUID() }]);
                      }}
                    />
                  ))}
                </div>
              )}

              <QuestionEditor
                isOpen={editorOpen}
                onClose={() => { setEditorOpen(false); setEditingQuestion(null); }}
                onSave={handleAddQuestion}
                initialData={editingQuestion}
              />
            </div>
          )}

          {/* Step 3: Deadline */}
          {currentStep === 2 && (
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
              <h3 className="text-base font-semibold mb-5">Deadline & Scheduling</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Open Date</label>
                  <input type="date" value={openDate} onChange={e => setOpenDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Due Date *</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Due Time</label>
                  <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <input type="checkbox" checked={autoPublish} onChange={e => setAutoPublish(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                  <div>
                    <span className="text-sm font-medium">Auto-publish on open date</span>
                    <p className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Automatically publish this assessment on the open date</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <input type="checkbox" checked={autoClose} onChange={e => setAutoClose(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                  <div>
                    <span className="text-sm font-medium">Auto-close on due date</span>
                    <p className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Stop accepting submissions after the deadline</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <input type="checkbox" checked={allowLate} onChange={e => setAllowLate(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                  <div>
                    <span className="text-sm font-medium">Allow late submissions</span>
                    <p className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Accept submissions after deadline with a penalty</p>
                  </div>
                </label>
                {allowLate && (
                  <div className="ml-10 w-48">
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Penalty per day (%)</label>
                    <input type="number" min={0} max={100} value={latePenalty} onChange={e => setLatePenalty(parseInt(e.target.value) || 0)} className={inputClass} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Assign */}
          {currentStep === 3 && (
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
              <h3 className="text-base font-semibold mb-5">Assign To</h3>
              <div className="flex gap-3 mb-6">
                {(['class', 'students', 'groups'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setAssignMode(m)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      assignMode === m
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20'
                        : (isDark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-black/5 text-black/50 hover:bg-black/10')
                    }`}
                  >
                    {m === 'class' ? 'Entire Class' : m === 'students' ? 'Selected Students' : 'Groups'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Class</label>
                  <input type="text" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} placeholder="e.g. CS-3rd Year" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Section</label>
                  <input type="text" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} placeholder="e.g. Section A" className={inputClass} />
                </div>
              </div>

              {assignMode === 'students' && (
                <div className={`mt-4 p-4 rounded-xl text-sm text-center ${isDark ? 'bg-white/[0.03] text-white/30' : 'bg-black/[0.02] text-black/30'}`}>
                  Individual student selection will be available after backend integration.
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                <h3 className="text-base font-semibold mb-4">Review</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Type', value: assessmentType || '—' },
                    { label: 'Title', value: title || '—' },
                    { label: 'Questions', value: String(questions.length) },
                    { label: 'Total Marks', value: String(totalMarks) },
                    { label: 'Time Limit', value: `${totalTime} min` },
                    { label: 'Due Date', value: dueDate || 'Not set' },
                    { label: 'Assign To', value: selectedClass || 'Not set' },
                    { label: 'Late Policy', value: allowLate ? `${latePenalty}% penalty/day` : 'Not allowed' },
                  ].map((item) => (
                    <div key={item.label} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                      <div className={`text-xs mb-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{item.label}</div>
                      <div className="text-sm font-medium capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {questions.length > 0 && (
                <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Questions Preview</h4>
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <QuestionCard key={q.id} question={q} index={i} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Navigation */}
      <div className={`flex items-center justify-between mt-8 pt-6 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 ${
            isDark ? 'text-white/60 hover:bg-white/5' : 'text-black/60 hover:bg-black/5'
          }`}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-3">
          <button onClick={() => handlePublish(true)} disabled={isSubmitting || !title} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 ${isDark ? 'text-white/40 hover:bg-white/5' : 'text-black/40 hover:bg-black/5'}`}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Draft
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={() => handlePublish(false)} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
