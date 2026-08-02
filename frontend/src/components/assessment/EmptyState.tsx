'use client';

import { type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className={`rounded-2xl p-10 text-center ${
      isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'
    }`}>
      <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <Icon size={28} className={isDark ? 'text-white/20' : 'text-black/20'} />
      </div>
      <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {title}
      </h3>
      <p className={`text-sm max-w-md mx-auto mb-5 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
        {description}
      </p>
      {actionLabel && (
        actionHref ? (
          <a
            href={actionHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
          >
            {actionLabel}
          </a>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
