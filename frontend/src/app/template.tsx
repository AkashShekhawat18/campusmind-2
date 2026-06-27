'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(4px)' }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1], // Signature Apple easing
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
