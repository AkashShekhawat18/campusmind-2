import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type PremiumLockPopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const PremiumLockPopup: React.FC<PremiumLockPopupProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#111113] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header pattern */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="p-8 pb-6 flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20 border border-orange-400/50">
                <Lock size={32} className="text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                Unlock Premium Models <Sparkles size={20} className="text-amber-400" />
              </h2>
              
              <p className="text-white/60 text-sm mb-8">
                Create a MALPHOR account to access the world's most powerful AI models.
              </p>

              <div className="w-full space-y-3 mb-8">
                {['GPT-4o & GPT-5 Access', 'Claude 3.5 Opus', 'Gemini 1.5 Ultra', 'Advanced Vision & PDF Analysis', 'Unlimited Chat History & Memory'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-green-400" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => router.push('/student/login')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create Account
                </button>
                <button
                  onClick={() => router.push('/student/login')}
                  className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  Login
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
