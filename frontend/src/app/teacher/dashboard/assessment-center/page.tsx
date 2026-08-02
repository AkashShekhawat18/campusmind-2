'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, PlusCircle, Wand2, BookCheck, FileCheck,
  Clock, CheckCircle2, BarChart3, ClipboardList, PenTool, Bot
} from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

export default function AssessmentCenterDashboard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [stats, setStats] = useState({ active: 0, scheduled: 0, completed: 0, drafts: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const token = localStorage.getItem('teacherToken');
        if (!token) return;

        const res = await fetch('http://localhost:5000/api/assessment/teacher', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecent(data.slice(0, 3));
          
          let active = 0, scheduled = 0, completed = 0, drafts = 0;
          data.forEach((a: any) => {
            if (a.status === 'ACTIVE') active++;
            else if (a.status === 'SCHEDULED') scheduled++;
            else if (a.status === 'COMPLETED') completed++;
            else if (a.status === 'DRAFT') drafts++;
          });
          setStats({ active, scheduled, completed, drafts });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const quickActions = [
    { label: 'Create Assessment', icon: PlusCircle, desc: 'Build a new quiz, test, or assignment', href: '/teacher/dashboard/assessment-center/create', color: 'from-blue-500 to-cyan-400' },
    { label: 'AI Generator', icon: Wand2, desc: 'Generate assessments with AI', href: '/teacher/dashboard/assessment-center/ai-generator', color: 'from-violet-500 to-purple-400' },
    { label: 'Test Paper', icon: PenTool, desc: 'Generate multi-section test papers', href: '/teacher/dashboard/assessment-center/test-generator', color: 'from-rose-500 to-pink-400' },
    { label: 'AI Assistant', icon: Bot, desc: 'Chat with the assessment assistant', href: '/teacher/dashboard/assessment-center/assistant', color: 'from-indigo-500 to-blue-400' },
  ];

  const statusCards = [
    { label: 'Active', icon: FileCheck, count: stats.active, color: 'from-emerald-500 to-green-400', href: '/teacher/dashboard/assessment-center/active' },
    { label: 'Scheduled', icon: Clock, count: stats.scheduled, color: 'from-amber-500 to-yellow-400', href: '/teacher/dashboard/assessment-center/scheduled' },
    { label: 'Completed', icon: CheckCircle2, count: stats.completed, color: 'from-blue-500 to-cyan-400', href: '/teacher/dashboard/assessment-center/completed' },
    { label: 'Drafts', icon: ClipboardList, count: stats.drafts, color: 'from-purple-500 to-violet-400', href: '/teacher/dashboard/assessment-center/drafts' },
  ];

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assessment Center</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              Create, manage, and analyze assessments
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <a
              key={card.label}
              href={card.href}
              className={`group relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] ${
                isDark
                  ? 'bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                  : 'bg-white border border-black/5 hover:border-black/10 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {card.count}
                </span>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {card.label} Assessments
              </p>
            </a>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className={`group relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02] ${
                  isDark
                    ? 'bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                    : 'bg-white border border-black/5 hover:border-black/10 hover:shadow-lg'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{action.label}</h3>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  {action.desc}
                </p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Recent Activity
        </h2>
        {loading ? (
          <div className={`p-8 text-center rounded-2xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <span className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Loading recent assessments...</span>
          </div>
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recent.map((a: any) => (
              <div key={a.id} className={`rounded-2xl p-4 transition-all ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-xs px-2 py-1 rounded-md font-medium ${
                    a.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                    a.status === 'DRAFT' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>{a.status}</div>
                  <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{a.title}</h3>
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  {a.type.toUpperCase()} · {a._count?.questions || 0} Questions · {a.totalMarks || 0} Marks
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={ClipboardList} 
            title="No assessments yet" 
            description="Create your first assessment to get started. Use the AI Generator for instant question creation."
            actionLabel="Create Assessment"
            actionHref="/teacher/dashboard/assessment-center/create"
          />
        )}
      </div>
    </div>
  );
}
