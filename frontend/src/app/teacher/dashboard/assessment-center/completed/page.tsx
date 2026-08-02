'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { CheckCircle2, Search, Download } from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

export default function CompletedAssessmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Completed Assessments</h1>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Past assessments with results</p>
            </div>
          </div>
          <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white text-black/50 hover:bg-black/5'}`}>
            <Download size={16} /> Export All
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search completed..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50' : 'bg-white border-black/10 text-black placeholder-black/30 focus:border-blue-500'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Completed', value: '0', color: 'from-blue-500 to-cyan-400' },
          { label: 'Total Submissions', value: '0', color: 'from-emerald-500 to-green-400' },
          { label: 'Avg. Score', value: '—', color: 'from-violet-500 to-purple-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
            <div className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
            <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <EmptyState icon={CheckCircle2} title="No completed assessments" description="Assessments that have passed their due date will appear here. Review submissions, grades, and analytics." />
    </div>
  );
}
