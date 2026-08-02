"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, BookOpen, Edit2, Sparkles, Copy, X } from 'lucide-react';

interface QuickActionMenuProps {
  isDark: boolean;
  onAction: (prompt: string) => void;
}

export function QuickActionMenu({ isDark, onAction }: QuickActionMenuProps) {
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect } | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const activeSelection = window.getSelection();
        const text = activeSelection?.toString().trim();
        
        if (text && text.length > 0 && activeSelection && activeSelection.rangeCount > 0) {
          const range = activeSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          // Only show if the selection is inside our chat area (we don't want it popping up over inputs)
          const isInsideChat = activeSelection.anchorNode?.parentElement?.closest('.chat-message-content');
          
          if (isInsideChat) {
            setSelection({ text, rect });
          } else {
            setSelection(null);
          }
        } else {
          setSelection(null);
        }
      }, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  if (!selection) return null;

  const top = selection.rect.top - 50; // Position above the selection
  const left = selection.rect.left + (selection.rect.width / 2);

  const actions = [
    { label: 'Explain', icon: HelpCircle, prompt: `Explain this text simply:\n\n"${selection.text}"` },
    { label: 'Summarize', icon: BookOpen, prompt: `Summarize this text:\n\n"${selection.text}"` },
    { label: 'Rewrite', icon: Edit2, prompt: `Rewrite this text professionally:\n\n"${selection.text}"` },
    { label: 'Ask AI', icon: Sparkles, prompt: `Regarding this text:\n\n"${selection.text}"\n\n` },
  ];

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{ top, left, transform: 'translateX(-50%)' }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className={`pointer-events-auto flex items-center p-1 rounded-xl shadow-2xl border ${
            isDark ? 'bg-[#1a1a1c] border-white/10' : 'bg-white border-black/10'
          }`}
        >
          <div className="flex gap-1 pr-2 border-r border-white/10 dark:border-white/10">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  onAction(action.prompt);
                  setSelection(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-black/5 text-black/70 hover:text-black'
                }`}
              >
                <action.icon size={12} />
                {action.label}
              </button>
            ))}
          </div>
          
          <div className="flex pl-1">
            <button
              onClick={() => {
                navigator.clipboard.writeText(selection.text);
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-black/5 text-black/60 hover:text-black'}`}
              title="Copy"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => setSelection(null)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-black/5 text-black/60 hover:text-black'}`}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
