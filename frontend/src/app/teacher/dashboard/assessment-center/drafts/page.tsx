'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { FileCog, Search, SortAsc } from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

export default function DraftsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FileCog size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Drafts</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Continue working on saved drafts</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search drafts..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50' : 'bg-white border-black/10 text-black placeholder-black/30 focus:border-blue-500'}`}
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`px-4 py-2.5 rounded-xl text-sm border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'}`}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
      </div>

      <EmptyState icon={FileCog} title="No drafts saved" description="Assessments you save as drafts will appear here. Resume editing and publish when ready." actionLabel="Create Assessment" actionHref="/teacher/dashboard/assessment-center/create" />
    </div>
  );
}
