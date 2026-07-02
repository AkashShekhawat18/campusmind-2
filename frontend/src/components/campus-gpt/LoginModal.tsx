import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, History, Mic, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;

  const features = [
    { icon: <Sparkles size={18} className="text-blue-500" />, text: "Unlimited AI Chats" },
    { icon: <History size={18} className="text-blue-500" />, text: "Saved Chat History" },
    { icon: <Mic size={18} className="text-blue-500" />, text: "Voice Assistant (Coming Soon)" },
    { icon: <FileText size={18} className="text-blue-500" />, text: "PDF Analysis (Coming Soon)" },
    { icon: <CheckCircle2 size={18} className="text-blue-500" />, text: "PYQ Question Solver" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`relative w-full max-w-md p-8 rounded-3xl shadow-2xl border ${
              isDarkMode 
                ? 'bg-[#1a1a1c] border-white/10 text-white shadow-blue-900/20' 
                : 'bg-white border-black/10 text-black shadow-blue-500/10'
            }`}
          >
            <button 
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mb-4 shadow-lg shadow-blue-500/30">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight">CampusGPT</h2>
              <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                You have reached your free demo limit.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <p className="font-semibold text-sm uppercase tracking-wider opacity-80 mb-4">Continue with:</p>
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    {feature.icon}
                  </div>
                  <span className="font-medium text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/student/login" className="w-full">
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Continue as Student
                </button>
              </Link>
              <Link href="/teacher/login" className="w-full">
                <button className={`w-full py-3.5 rounded-xl font-semibold border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isDarkMode 
                    ? 'border-white/20 hover:bg-white/5 text-white' 
                    : 'border-black/20 hover:bg-black/5 text-black'
                }`}>
                  Continue as Teacher
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
