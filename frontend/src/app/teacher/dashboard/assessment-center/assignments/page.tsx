'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { BookCheck, Search, Plus, Filter } from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

const tabs = ['All', 'Homework', 'Quiz', 'Class Test', 'Lab', 'Coding'];

export default function AssignmentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BookCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                Manage all types of assignments
              </p>
            </div>
          </div>
          <a
            href="/teacher/dashboard/assessment-center/create"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} /> New Assignment
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20'
                : (isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-black/5 text-black/40 hover:bg-black/10')
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
              isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50'
                : 'bg-white border-black/10 text-black placeholder-black/30 focus:border-blue-500'
            }`}
          />
        </div>
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
          isDark ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-white text-black/50 hover:bg-black/5'
        }`}>
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Empty State */}
      <EmptyState
        icon={BookCheck}
        title="No assignments yet"
        description={`No ${activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}assignments found. Create your first assignment to get started.`}
        actionLabel="Create Assignment"
        actionHref="/teacher/dashboard/assessment-center/create"
      />
    </div>
  );
}
