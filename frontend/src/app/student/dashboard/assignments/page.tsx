'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { LayoutDashboard, FileCheck, Clock, CheckCircle2, ClipboardList, PenTool } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentAssignmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const router = useRouter();

  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const token = localStorage.getItem('studentToken');
        if (!token) {
          router.push('/student/login');
          return;
        }

        const res = await fetch('http://localhost:5000/api/student/assessments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setAssessments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, [router]);

  const activeAssessments = assessments.filter(a => a.status === 'ACTIVE' && a.submissions.length === 0);
  const completedAssessments = assessments.filter(a => a.submissions.length > 0);
  const scheduledAssessments = assessments.filter(a => a.status === 'SCHEDULED' && a.submissions.length === 0);

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ClipboardList size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Assignments</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              View and complete your assigned quizzes and tests
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Box */}
        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <PenTool size={16} />
            </div>
            <h2 className="text-lg font-semibold">To Do</h2>
          </div>
          {loading ? (
            <p className="text-sm opacity-50">Loading...</p>
          ) : activeAssessments.length > 0 ? (
            <div className="space-y-3">
              {activeAssessments.map(a => (
                <div key={a.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <h3 className="font-medium text-sm mb-1">{a.title}</h3>
                  <p className={`text-xs mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {a.type.toUpperCase()} · {a._count?.questions} Questions · {a.teacher?.name}
                  </p>
                  <Link href={`/student/dashboard/assignments/${a.id}`} className="block w-full text-center px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                    Start Assessment
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No active assignments right now.</p>
          )}
        </div>

        {/* Scheduled Box */}
        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <h2 className="text-lg font-semibold">Upcoming</h2>
          </div>
          {loading ? (
            <p className="text-sm opacity-50">Loading...</p>
          ) : scheduledAssessments.length > 0 ? (
            <div className="space-y-3">
              {scheduledAssessments.map(a => (
                <div key={a.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <h3 className="font-medium text-sm mb-1">{a.title}</h3>
                  <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    Opens: {new Date(a.openDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No upcoming assignments scheduled.</p>
          )}
        </div>

        {/* Completed Box */}
        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <h2 className="text-lg font-semibold">Completed</h2>
          </div>
          {loading ? (
            <p className="text-sm opacity-50">Loading...</p>
          ) : completedAssessments.length > 0 ? (
            <div className="space-y-3">
              {completedAssessments.map(a => (
                <div key={a.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <h3 className="font-medium text-sm mb-1">{a.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      Score: {a.submissions[0].totalScore} / {a.totalMarks}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {new Date(a.submissions[0].submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>You haven't completed any assignments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
