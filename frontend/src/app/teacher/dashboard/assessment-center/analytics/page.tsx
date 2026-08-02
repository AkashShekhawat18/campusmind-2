'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/assessment/EmptyState';

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const statCards = [
    { label: 'Submission Rate', value: '—', sub: 'No data', icon: Users, color: 'from-blue-500 to-cyan-400' },
    { label: 'Average Score', value: '—', sub: 'No data', icon: TrendingUp, color: 'from-emerald-500 to-green-400' },
    { label: 'Highest Score', value: '—', sub: 'No data', icon: Target, color: 'from-violet-500 to-purple-400' },
    { label: 'At-Risk Students', value: '—', sub: 'No data', icon: AlertTriangle, color: 'from-amber-500 to-yellow-400' },
  ];

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Performance insights and topic analysis</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg`}>
                  <Icon size={16} className="text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{card.sub}</div>
              <div className={`text-xs mt-0.5 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Score Distribution */}
        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <h3 className="text-sm font-semibold mb-4">Score Distribution</h3>
          <div className="flex items-end gap-2 h-40 px-2">
            {['0-20', '21-40', '41-60', '61-80', '81-100'].map((range, i) => (
              <div key={range} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full rounded-t-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`} style={{ height: '4px' }} />
                <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>{range}</span>
              </div>
            ))}
          </div>
          <p className={`text-center text-xs mt-3 ${isDark ? 'text-white/20' : 'text-black/20'}`}>No data available</p>
        </div>

        {/* Topic Performance */}
        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          <h3 className="text-sm font-semibold mb-4">Topic Performance</h3>
          <div className="space-y-3">
            {['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming'].map(topic => (
              <div key={topic}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={isDark ? 'text-white/50' : 'text-black/50'}>{topic}</span>
                  <span className={isDark ? 'text-white/30' : 'text-black/30'}>—</span>
                </div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-400/20" style={{ width: '0%' }} />
                </div>
              </div>
            ))}
          </div>
          <p className={`text-center text-xs mt-3 ${isDark ? 'text-white/20' : 'text-black/20'}`}>Topics will populate from assessment data</p>
        </div>
      </div>

      {/* Weak Concepts */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
        <h3 className="text-sm font-semibold mb-4">Weak Concept Detection</h3>
        <EmptyState icon={BarChart3} title="No analytics data yet" description="Analytics will populate once assessments are completed. View submission rates, average scores, difficulty breakdowns, and identify weak concepts." />
      </div>
    </div>
  );
}
