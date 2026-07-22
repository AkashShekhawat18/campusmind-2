'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Navigation, HelpCircle, FileText, ChevronRight, 
  Paperclip, Globe, GraduationCap, Copy, Check, Sparkles, 
  ExternalLink, Image as ImageIcon, FileUp, RefreshCw
} from 'lucide-react';
import { useMalphorStore } from '@/hooks/useMalphorStore';
import { detectMalphorIntent, KBEntry } from '@/lib/malphorKnowledgeBase';
import LatexText from '@/components/LatexText';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  mode?: 'WEBSITE_INSTANT' | 'WEBSITE_LLM' | 'ACADEMIC_AI';
  actionUrl?: string;
  actionLabel?: string;
  fileName?: string;
  fileType?: string;
  citations?: string[];
}

interface MalphorChatProps {
  isOpen: boolean;
  onClose: () => void;
  onBotSpeak: (text: string) => void;
}

export function MalphorChat({ isOpen, onClose, onBotSpeak }: MalphorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: "👋 Hi! I am **Malphor**, your Hybrid Intelligent Assistant. I can instantly guide you through **CampusMind website navigation** or assist with **academic questions, homework, coding, LaTeX math, PDF summaries, and image OCR**!",
      mode: 'WEBSITE_INSTANT'
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; content: string } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'WEBSITE_INSTANT' | 'WEBSITE_LLM' | 'ACADEMIC_AI'>('WEBSITE_INSTANT');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const { setBaseState, fireGesture, setTalkingIntensity } = useMalphorStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Click outside & Escape key listeners to close chat window
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('.group') || target.closest('canvas') || target.closest('.no-chat-trigger')) return;
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const quickActions = [
    {
      icon: Navigation,
      label: 'Where is Teacher Portal?',
      query: 'Where is the Teacher Portal?'
    },
    {
      icon: Sparkles,
      label: 'What is PYQ Analyzer?',
      query: 'What is the PYQ Analyzer?'
    },
    {
      icon: GraduationCap,
      label: 'Explain DBMS Concepts',
      query: 'Explain DBMS normalization and ACID properties'
    },
    {
      icon: FileText,
      label: 'Solve Quadratic Eq ($x^2-4=0$)',
      query: 'Solve the equation $x^2 - 4 = 0$ step by step with LaTeX'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string || '';
      setAttachedFile({
        name: file.name,
        type: file.type,
        content: text
      });
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const executeQuery = async (queryText: string) => {
    if ((!queryText.trim() && !attachedFile) || isProcessing) return;

    const userMsgId = Date.now().toString();
    const filePayload = attachedFile;

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: queryText,
      fileName: filePayload?.name,
      fileType: filePayload?.type
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // ── STEP 1: Intent Detection ──────────────────────────────
    const intent = detectMalphorIntent(queryText);
    setCurrentMode(intent.type);

    // ── STEP 2: Instant Website KB Match (0ms latency, 0 LLM token)
    if (intent.type === 'WEBSITE_INSTANT' && !filePayload) {
      setBaseState('talking');
      fireGesture('nod');
      onBotSpeak(`Here is the information for ${intent.entry.title}! 🚀`);

      setTimeout(() => {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `**${intent.entry.title}**\n\n${intent.entry.content}`,
          mode: 'WEBSITE_INSTANT',
          actionUrl: intent.entry.actionUrl,
          actionLabel: intent.entry.actionLabel
        };
        setMessages((prev) => [...prev, botMsg]);
        setBaseState('idle');
        fireGesture('hop');
      }, 400);

      return;
    }

    // ── STEP 3: Website LLM or Academic AI Request ───────────
    setIsProcessing(true);
    setBaseState('thinking');
    fireGesture('nod');
    onBotSpeak(intent.type === 'WEBSITE_LLM' ? 'Searching Website Knowledge Base...' : 'Processing Academic Inquiry...');

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.text
      }));

      let fileContextText = null;
      if (filePayload) {
        if (filePayload.type.startsWith('image/')) {
          fileContextText = `[IMAGE ATTACHMENT: "${filePayload.name}" - Data URL provided for visual/OCR extraction]`;
        } else {
          fileContextText = `[DOCUMENT ATTACHMENT: "${filePayload.name}"]\n${filePayload.content.substring(0, 3000)}`;
        }
      }

      const isWebsite = intent.type === 'WEBSITE_LLM';

      const response = await fetch('/api/ai-router/malphor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText || (filePayload ? `Analyze attached file: ${filePayload.name}` : ''),
          history: historyPayload,
          fileContext: fileContextText,
          isWebsiteQuery: isWebsite
        })
      });

      const data = await response.json();
      const replyText = data.reply || 'No response generated.';

      setBaseState('talking');
      setTalkingIntensity(0.8);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        mode: data.mode || intent.type,
        citations: filePayload ? [`File: ${filePayload.name}`] : undefined
      };

      setMessages((prev) => [...prev, botMsg]);
      onBotSpeak(replyText.slice(0, 100) + '...');

    } catch (err) {
      console.error("Malphor Chat Error:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "⚠️ Sorry, I encountered a temporary connection issue. Please try again.",
        mode: 'ACADEMIC_AI'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setBaseState('idle');
      fireGesture('hop');
      setTalkingIntensity(0);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(input);
  };

  const copyCodeToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={chatWindowRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px] h-[520px] max-h-[calc(100vh-100px)] min-h-[350px] bg-[#0a0a0c]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-[0_10px_50px_-10px_rgba(0,229,255,0.25)] flex flex-col overflow-hidden z-50 support-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00e5ff]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
                  MALPHOR ASSISTANT
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    currentMode === 'ACADEMIC_AI' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {currentMode === 'ACADEMIC_AI' ? (
                      <><GraduationCap size={10} /> Academic AI</>
                    ) : (
                      <><Globe size={10} /> Website KB</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Close Assistant (Esc)"
              className="text-white/70 hover:text-white bg-white/10 hover:bg-red-500/20 hover:border-red-500/40 border border-white/10 transition-all px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer"
            >
              <span>Close</span>
              <X size={15} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* File badge if user attached file */}
                {msg.fileName && (
                  <div className="mb-1.5 px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-xs text-cyan-200 flex items-center gap-1.5">
                    {msg.fileType?.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
                    <span className="font-medium truncate max-w-[180px]">{msg.fileName}</span>
                  </div>
                )}

                <div
                  className={`max-w-[90%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-500 text-black font-medium rounded-tr-xs shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                      : 'bg-white/5 text-white/95 border border-white/10 rounded-tl-xs shadow-lg'
                  }`}
                >
                  <LatexText className="whitespace-pre-wrap">{msg.text}</LatexText>

                  {/* Mode Badge inside message */}
                  {msg.role === 'assistant' && msg.mode && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
                      <span className="flex items-center gap-1">
                        {msg.mode === 'ACADEMIC_AI' ? <GraduationCap size={10} className="text-purple-400" /> : <Globe size={10} className="text-cyan-400" />}
                        {msg.mode === 'ACADEMIC_AI' ? 'Academic AI Engine' : 'Website Knowledge Base'}
                      </span>
                    </div>
                  )}

                  {/* Action Link Button for Instant KB */}
                  {msg.actionUrl && (
                    <div className="mt-3">
                      <Link
                        href={msg.actionUrl}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-semibold text-xs hover:bg-cyan-300 transition-colors shadow-md"
                      >
                        {msg.actionLabel || 'Navigate Now'}
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl w-fit text-cyan-300 text-xs">
                <RefreshCw size={14} className="animate-spin text-cyan-400" />
                <span>Malphor is formulating response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-2 border-t border-white/5 bg-black/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => executeQuery(action.query)}
                disabled={isProcessing}
                className="whitespace-nowrap px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-[11px] text-white/80 hover:text-cyan-300 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40"
              >
                <action.icon size={12} className="text-cyan-400" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-white/10 bg-black/60">
            {/* Attached File Preview */}
            {attachedFile && (
              <div className="mb-2 px-3 py-1.5 bg-cyan-950/80 border border-cyan-500/50 rounded-xl flex items-center justify-between text-xs text-cyan-200">
                <div className="flex items-center gap-2 truncate">
                  {attachedFile.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                  <span className="truncate max-w-[220px] font-medium">{attachedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-white/60 hover:text-white p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="relative flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf,.txt"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                title="Attach PDF or Image for OCR / Analysis"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 text-white/60 hover:text-cyan-300 transition-all disabled:opacity-40 shrink-0"
              >
                <Paperclip size={16} />
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Malphor anything (Website or Academic)..."
                  disabled={isProcessing}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/60 focus:bg-white/10 transition-all disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={(!input.trim() && !attachedFile) || isProcessing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
