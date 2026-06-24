'use client';
import { motion } from 'framer-motion';

export function VoiceWave({ isListening, isSpeaking }: { isListening: boolean; isSpeaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Core orb */}
      <motion.div
        className="absolute w-16 h-16 rounded-full bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.8)]"
        animate={{
          scale: isSpeaking ? [1, 1.4, 1.1, 1.5, 1] : isListening ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isSpeaking ? 1 : isListening ? 0.8 : 0.6,
        }}
        transition={{
          duration: isSpeaking ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Outer ripples */}
      {isListening && (
        <>
          <motion.div
            className="absolute w-16 h-16 rounded-full border-2 border-blue-400"
            animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-16 h-16 rounded-full border-2 border-blue-400"
            animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.75 }}
          />
        </>
      )}
    </div>
  );
}
