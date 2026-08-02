'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

type Status = 'draft' | 'active' | 'scheduled' | 'completed' | 'graded' | 'late' | 'pending' | 'submitted';

const statusConfig: Record<Status, { label: string; darkBg: string; darkText: string; lightBg: string; lightText: string }> = {
  draft:     { label: 'Draft',     darkBg: 'bg-gray-500/10',   darkText: 'text-gray-400',    lightBg: 'bg-gray-100',    lightText: 'text-gray-600' },
  active:    { label: 'Active',    darkBg: 'bg-emerald-500/10', darkText: 'text-emerald-400', lightBg: 'bg-emerald-50',  lightText: 'text-emerald-600' },
  scheduled: { label: 'Scheduled', darkBg: 'bg-amber-500/10',  darkText: 'text-amber-400',   lightBg: 'bg-amber-50',    lightText: 'text-amber-600' },
  completed: { label: 'Completed', darkBg: 'bg-blue-500/10',   darkText: 'text-blue-400',    lightBg: 'bg-blue-50',     lightText: 'text-blue-600' },
  graded:    { label: 'Graded',    darkBg: 'bg-purple-500/10', darkText: 'text-purple-400',   lightBg: 'bg-purple-50',   lightText: 'text-purple-600' },
  late:      { label: 'Late',      darkBg: 'bg-red-500/10',    darkText: 'text-red-400',     lightBg: 'bg-red-50',      lightText: 'text-red-600' },
  pending:   { label: 'Pending',   darkBg: 'bg-orange-500/10', darkText: 'text-orange-400',   lightBg: 'bg-orange-50',   lightText: 'text-orange-600' },
  submitted: { label: 'Submitted', darkBg: 'bg-cyan-500/10',   darkText: 'text-cyan-400',    lightBg: 'bg-cyan-50',     lightText: 'text-cyan-600' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
      isDark ? `${config.darkBg} ${config.darkText}` : `${config.lightBg} ${config.lightText}`
    } ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        isDark ? config.darkText.replace('text-', 'bg-') : config.lightText.replace('text-', 'bg-')
      }`} />
      {config.label}
    </span>
  );
}

export type { Status };
