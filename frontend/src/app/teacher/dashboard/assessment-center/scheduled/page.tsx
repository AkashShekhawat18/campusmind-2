'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Clock, Search, Calendar } from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

export default function ScheduledAssessmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Scheduled Assessments</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Upcoming assessments set to publish automatically</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search scheduled..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50' : 'bg-white border-black/10 text-black placeholder-black/30 focus:border-blue-500'}`}
          />
        </div>
      </div>

      <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-amber-50 border border-amber-200'}`}>
        <Calendar size={18} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
        <p className={`text-sm ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
          Scheduled assessments auto-publish on their set date. You can edit or cancel them before they go live.
        </p>
      </div>

      <EmptyState icon={Clock} title="No scheduled assessments" description="Schedule assessments with auto-publish and auto-close dates. Set deadlines, late submission policies, and reminder notifications." actionLabel="Create Assessment" actionHref="/teacher/dashboard/assessment-center/create" />
    </div>
  );
}
