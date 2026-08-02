"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDark: boolean;
  title?: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDark, title }: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative w-full max-w-sm rounded-3xl shadow-2xl p-6 border ${
              isDark ? 'bg-[#1a1a1c] border-white/10' : 'bg-white border-black/10'
            }`}
          >
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-black/50 hover:text-black'
              }`}
            >
              <X size={16} />
            </button>

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-500'
            }`}>
              <Trash2 size={24} />
            </div>
            
            <h3 className="text-xl font-bold mb-2">Delete Chat?</h3>
            <p className="text-sm opacity-60 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-current opacity-100">"{title || 'this chat'}"</span>? This action cannot be undone and will remove all associated history.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
