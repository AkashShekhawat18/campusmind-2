'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { FileText, Search, Download, Filter, ChevronDown } from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

const tableHeaders = ['Student', 'Assessment', 'Score', 'Time Taken', 'Status', 'Submitted'];

export default function ResultsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssessment, setFilterAssessment] = useState('all');

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Results</h1>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Student submissions, grades, and AI evaluation reports</p>
            </div>
          </div>
          <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white text-black/50 hover:bg-black/5'}`}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50' : 'bg-white border-black/10 text-black placeholder-black/30 focus:border-blue-500'}`}
          />
        </div>
        <select value={filterAssessment} onChange={e => setFilterAssessment(e.target.value)} className={`px-4 py-2.5 rounded-xl text-sm border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'}`}>
          <option value="all">All Assessments</option>
        </select>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white text-black/50 hover:bg-black/5'}`}>
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Submissions', value: '0', color: 'from-blue-500 to-cyan-400' },
          { label: 'Graded', value: '0', color: 'from-emerald-500 to-green-400' },
          { label: 'Pending Review', value: '0', color: 'from-amber-500 to-yellow-400' },
          { label: 'Avg. Score', value: '—', color: 'from-violet-500 to-purple-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
            <div className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
            <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Empty Table */}
      <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
        <div className={`grid grid-cols-6 gap-4 px-5 py-3 text-xs font-medium ${isDark ? 'bg-white/[0.03] text-white/40' : 'bg-black/[0.02] text-black/40'}`}>
          {tableHeaders.map(h => (
            <div key={h} className="flex items-center gap-1 cursor-pointer hover:opacity-80">
              {h} <ChevronDown size={12} />
            </div>
          ))}
        </div>
        <div className="p-8">
          <EmptyState icon={FileText} title="No results available" description="Student grades, AI evaluations, and feedback reports will appear here after submissions are graded." />
        </div>
      </div>
    </div>
  );
}
