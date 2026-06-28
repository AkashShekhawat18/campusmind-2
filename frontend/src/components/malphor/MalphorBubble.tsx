'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface MalphorBubbleProps {
  text: string | null;
  visible: boolean;
}

export function MalphorBubble({ text, visible }: MalphorBubbleProps) {
  return (
    <AnimatePresence>
      {visible && text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10, rotateX: -20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative bg-black/80 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.2)] rounded-2xl px-5 py-3 text-sm text-cyan-50 font-medium z-50 select-none whitespace-pre-wrap origin-bottom-right"
        >
          {text}
          {/* Bubble Tail */}
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black/80 border-b border-r border-cyan-500/30 transform rotate-45 shadow-[2px_2px_10px_rgba(0,229,255,0.1)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
