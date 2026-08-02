"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Terminal, Table } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'code' | 'table' | 'text';
  content: string;
  language?: string;
  isDark: boolean;
}

export function ArtifactModal({ isOpen, onClose, type, content, language, isDark }: ArtifactModalProps) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
              isDark ? 'bg-[#111113] border-white/10' : 'bg-[#f8f9fa] border-black/10'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/5 bg-[#1a1a1c]' : 'border-black/5 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  {type === 'code' ? <Terminal size={16} className="text-indigo-400" /> : <Table size={16} className="text-emerald-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {type === 'code' ? `Code Snippet (${language || 'text'})` : 'Data Table'}
                  </h3>
                  <p className="text-[10px] opacity-50 uppercase tracking-wider font-bold">Artifact Viewer</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/5 text-black/70'
                  }`}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <div className={`w-px h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/5 text-black/70'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6">
              {type === 'code' ? (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={language || 'text'}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: 0, background: 'transparent', fontSize: '14px' }}
                >
                  {content}
                </SyntaxHighlighter>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap">{content}</pre>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
