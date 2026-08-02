'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Send, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

export default function TestTakingInterface({ params }: { params: { id: string } }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const router = useRouter();

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  
  // State for student answers: questionId -> { selectedOptionId?: string, textResponse?: string }
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string, textResponse?: string }>>({});

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const token = localStorage.getItem('studentToken');
        if (!token) return router.push('/student/login');

        const res = await fetch(`http://localhost:5000/api/student/assessments/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          // Redirect if already submitted
          if (data.submissions && data.submissions.length > 0) {
            alert('You have already submitted this assessment.');
            router.push('/student/dashboard/assignments');
            return;
          }
          setAssessment(data);
        } else {
          router.push('/student/dashboard/assignments');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [params.id, router]);

  const handleOptionSelect = (qId: string, optId: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { selectedOptionId: optId }
    }));
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { textResponse: text }
    }));
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? You cannot change your answers later.')) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('studentToken');
      
      const payload = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        ...ans
      }));

      const res = await fetch(`http://localhost:5000/api/student/assessments/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: payload })
      });

      if (res.ok) {
        alert('Assessment submitted successfully!');
        router.push('/student/dashboard/assignments');
      } else {
        const err = await res.json();
        alert(err.error || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className={`min-h-full p-10 flex justify-center items-center ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-[#f0f0f5] text-black'}`}>
      <Loader2 size={32} className="animate-spin opacity-50" />
    </div>
  );

  if (!assessment) return null;

  const question = assessment.questions[currentQ];

  return (
    <div className={`min-h-full p-6 flex flex-col ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-8 p-4 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
        <div>
          <h1 className="text-xl font-bold">{assessment.title}</h1>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {assessment.questions.length} Questions · {assessment.totalMarks} Marks
          </p>
        </div>
        {assessment.timeLimit && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
            <Clock size={16} /> Time Limit: {assessment.timeLimit} mins
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar Nav */}
        <div className={`col-span-1 rounded-2xl p-4 h-fit ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {assessment.questions.map((q: any, i: number) => {
              const isAnswered = !!answers[q.id]?.selectedOptionId || !!answers[q.id]?.textResponse;
              const isCurrent = currentQ === i;
              
              let bg = isDark ? 'bg-white/5' : 'bg-black/5';
              let text = isDark ? 'text-white/50' : 'text-black/50';
              let border = 'border-transparent';

              if (isCurrent) {
                bg = 'bg-blue-500 text-white';
                text = 'text-white';
              } else if (isAnswered) {
                bg = isDark ? 'bg-emerald-500/20' : 'bg-emerald-50';
                text = 'text-emerald-500';
                border = 'border-emerald-500/50';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(i)}
                  className={`aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-all border ${bg} ${text} ${border}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Area */}
        <div className={`col-span-1 md:col-span-3 flex flex-col rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <div className="flex justify-between items-start mb-6">
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              Question {currentQ + 1} of {assessment.questions.length}
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              Marks: {question.marks}
            </span>
          </div>

          <div className="text-base leading-relaxed mb-8">
            {question.text}
          </div>

          {/* Options / Input */}
          <div className="flex-1">
            {question.options && question.options.length > 0 ? (
              <div className="space-y-3">
                {question.options.map((opt: any) => {
                  const isSelected = answers[question.id]?.selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(question.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? (isDark ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-blue-50 border-blue-500 text-blue-600')
                          : (isDark ? 'bg-white/[0.02] border-white/10 hover:bg-white/5' : 'bg-black/[0.02] border-black/10 hover:bg-black/5')
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-blue-500' : (isDark ? 'border-white/20' : 'border-black/20')
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                        <span className="text-sm">{opt.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[question.id]?.textResponse || ''}
                onChange={(e) => handleTextChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                className={`w-full p-4 rounded-xl resize-none outline-none border transition-colors ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50'
                    : 'bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-blue-500'
                }`}
              />
            )}
          </div>

          {/* Bottom Nav */}
          <div className={`flex items-center justify-between mt-8 pt-6 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30 ${
                isDark ? 'text-white/60 hover:bg-white/5' : 'text-black/60 hover:bg-black/5'
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {currentQ < assessment.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
