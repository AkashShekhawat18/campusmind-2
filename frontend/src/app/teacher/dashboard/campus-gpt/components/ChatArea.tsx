"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Bot, File, Paperclip, Loader2, BookOpen, Presentation, FileCode, CheckSquare, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from './types';
import { MessageBubble } from './MessageBubble';
import { SmartSuggestions } from './SmartSuggestions';
import { RAGIndicator } from './RAGIndicator';
import { QuickActionMenu } from './QuickActionMenu';

interface ChatAreaProps {
  isDark: boolean;
  messages: Message[];
  isTyping: boolean;
  openDropzone: () => void;
  onSendSuggestion: (prompt: string) => void;
  onEditMessage: (prompt: string) => void;
}

export function ChatArea({ isDark, messages, isTyping, openDropzone, onSendSuggestion, onEditMessage }: ChatAreaProps) {
  const [showRAG, setShowRAG] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  // Handle RAG indicator visibility
  useEffect(() => {
    if (isTyping && messages[messages.length - 1]?.role !== 'assistant') {
      setShowRAG(true);
    } else if (!isTyping) {
      setShowRAG(false);
    }
  }, [isTyping, messages]);

  // Handle auto-scroll only if we are not scrolled up by the user
  useEffect(() => {
    if (scrollRef.current && !isScrolledUp) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, showRAG, isScrolledUp]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    // We consider "scrolled up" if they are more than 100px from the bottom
    const isUp = target.scrollHeight - target.scrollTop - target.clientHeight > 100;
    setIsScrolledUp(isUp);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setIsScrolledUp(false);
    }
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-8 custom-scrollbar relative scroll-smooth" 
      data-lenis-prevent
    >
      <QuickActionMenu isDark={isDark} onAction={onSendSuggestion} />
      
      {/* Scroll to Bottom FAB */}
      <AnimatePresence>
        {isScrolledUp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 right-8 md:right-16 z-50"
          >
            <button
              onClick={scrollToBottom}
              className={`p-3 rounded-full shadow-2xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                isDark ? 'bg-[#1a1a1c] border-white/10 hover:bg-white/10' : 'bg-white border-black/10 hover:bg-black/5'
              }`}
              title="Scroll to bottom"
            >
              <ArrowDown size={18} className={isDark ? 'text-white' : 'text-black'} />
              {isTyping && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-pulse border-2 border-[#1a1a1c]"></span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 ? (
        <div className="min-h-full py-10 flex flex-col items-center justify-center opacity-90 pb-20">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20"
          >
            <Bot size={32} className="text-white" />
          </motion.div>
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black mb-3 tracking-tight"
          >
            CampusGPT Workspace
          </motion.h2>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base opacity-60 max-w-md text-center mb-10 leading-relaxed font-medium"
          >
            How can I help you teach today? Upload documents, generate resources, or start with a prompt below.
          </motion.p>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full"
          >
            <StarterCard 
              icon={<BookOpen size={20} className="text-blue-400" />}
              title="Draft a Syllabus"
              desc="Create a comprehensive course outline"
              onClick={() => onSendSuggestion("Please draft a comprehensive syllabus for a 12-week course on [Subject]. Include weekly topics, learning objectives, and grading criteria.")}
              isDark={isDark}
            />
            <StarterCard 
              icon={<CheckSquare size={20} className="text-emerald-400" />}
              title="Generate Quiz"
              desc="Create multiple-choice questions"
              onClick={() => onSendSuggestion("Generate a 10-question multiple-choice quiz based on the key concepts of [Topic]. Include the answer key at the bottom.")}
              isDark={isDark}
            />
            <StarterCard 
              icon={<Presentation size={20} className="text-purple-400" />}
              title="Lesson Plan"
              desc="Structure a 60-minute lecture"
              onClick={() => onSendSuggestion("Create a detailed 60-minute lesson plan for [Topic]. Break it down into introduction, core activity, discussion, and conclusion.")}
              isDark={isDark}
            />
            <StarterCard 
              icon={<FileCode size={20} className="text-orange-400" />}
              title="Analyze Data"
              desc="Extract insights from CSV/Excel"
              onClick={() => openDropzone()}
              isDark={isDark}
            />
          </motion.div>
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto w-full pb-64">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <React.Fragment key={msg.id}>
                <MessageBubble msg={msg} isDark={isDark} onEdit={onEditMessage} />
                {msg.role === 'assistant' && idx === messages.length - 1 && !isTyping && (
                  <SmartSuggestions isDark={isDark} onSelect={onSendSuggestion} />
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
          
          {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start w-full max-w-3xl"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <Bot size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {showRAG ? (
                  <RAGIndicator isDark={isDark} onComplete={() => setShowRAG(false)} />
                ) : (
                  <div className={`px-5 py-4 rounded-3xl rounded-tl-sm border inline-block ${isDark ? 'bg-transparent text-white border-white/10' : 'bg-white text-black border-black/5 shadow-sm'}`}>
                    <div className="flex items-center gap-2 text-xs font-semibold opacity-70 text-indigo-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Response...</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function StarterCard({ icon, title, desc, onClick, isDark }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, isDark: boolean }) {
  return (
    <div 
      onClick={onClick} 
      className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-start gap-4 ${
        isDark 
          ? 'bg-[#1a1a1c]/50 border-white/5 hover:border-white/20 hover:bg-white/5' 
          : 'bg-white/50 border-black/5 hover:border-black/20 hover:bg-black/5 shadow-sm'
      }`}
    >
      <div className={`p-2.5 rounded-xl shrink-0 ${isDark ? 'bg-black/30' : 'bg-black/5'}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-sm mb-1">{title}</h3>
        <p className="text-xs opacity-60 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
