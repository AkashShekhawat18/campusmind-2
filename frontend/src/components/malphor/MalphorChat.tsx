'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Navigation, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import { useMalphorStore } from '@/hooks/useMalphorStore';

interface MalphorChatProps {
  isOpen: boolean;
  onClose: () => void;
  onBotSpeak: (text: string) => void;
}

export function MalphorChat({ isOpen, onClose, onBotSpeak }: MalphorChatProps) {
  const [messages, setMessages] = useState([
    { id: '1', type: 'bot', text: 'CampusMind Support initialized. How can I assist your navigation today?' },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { setBaseState, fireGesture, setTalkingIntensity } = useMalphorStore();

  const quickActions = [
    {
      icon: Navigation,
      label: 'Where is the login?',
      reply: 'The login portal is accessible from the top right corner, or via the "Get Started" buttons.',
    },
    {
      icon: FileText,
      label: 'What is CampusMind?',
      reply: 'CampusMind is a premium AI-powered educational ecosystem designed for modern institutions.',
    },
    {
      icon: HelpCircle,
      label: 'Need navigation help',
      reply: 'I can guide you! Try scrolling down to see our core features and platform previews.',
    },
  ];

  // Simulate streamed text response with thinking → talking → idle transitions
  const simulateResponse = (replyText: string) => {
    // ── Phase 1: Thinking ──
    setBaseState('thinking');
    fireGesture('nod');
    onBotSpeak('Processing inquiry...');

    const thinkDuration = 800 + Math.random() * 700; // 0.8–1.5s think time

    setTimeout(() => {
      // ── Phase 2: Talking (simulated streaming) ──
      setBaseState('talking');
      setIsStreaming(true);

      let charIndex = 0;
      const streamMsgId = Date.now().toString();

      // Add a placeholder message that we'll "stream" into
      setMessages((prev) => [...prev, { id: streamMsgId, type: 'bot', text: '' }]);

      // Stream characters to simulate LLM output
      const charsPerTick = 2 + Math.floor(Math.random() * 3); // 2–4 chars per tick
      const tickMs = 30;

      streamIntervalRef.current = setInterval(() => {
        charIndex += charsPerTick;

        if (charIndex >= replyText.length) {
          charIndex = replyText.length;
          if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

          // ── Phase 3: Done → idle ──
          setIsStreaming(false);
          setBaseState('idle');
          fireGesture('hop'); // Emphasis: response complete
          setTalkingIntensity(0);
        } else {
          // Drive talking intensity from streaming speed
          const intensity = Math.min(1, (charsPerTick / tickMs) * 15);
          setTalkingIntensity(intensity);
        }

        // Update the streaming message
        const visibleText = replyText.slice(0, charIndex);
        setMessages((prev) =>
          prev.map((m) => (m.id === streamMsgId ? { ...m, text: visibleText } : m))
        );
      }, tickMs);

      onBotSpeak(replyText);
    }, thinkDuration);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = { id: Date.now().toString(), type: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Fire a gesture on send
    fireGesture('nod');

    simulateResponse(
      'I am a basic support assistant. For deep learning tasks, please consult the primary AI.'
    );
  };

  const handleQuickAction = (reply: string) => {
    if (isStreaming) return;
    simulateResponse(reply);
  };

  // Cleanup stream on unmount or close
  useEffect(() => {
    if (!isOpen && streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      setIsStreaming(false);
      setBaseState('idle');
    }
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isOpen, setBaseState]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="fixed bottom-36 right-6 w-[340px] h-[480px] bg-[#0a0a0c]/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,229,255,0.15)] flex flex-col overflow-hidden z-50 support-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-r from-cyan-950/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00e5ff]" />
              <h3 className="text-white font-medium text-sm tracking-wide">SUPPORT CONSOLE</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.type === 'user'
                      ? 'bg-cyan-500 text-black font-medium rounded-tr-sm'
                      : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                  {/* Streaming cursor */}
                  {msg.type === 'bot' && isStreaming && msg.id === messages[messages.length - 1]?.id && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-cyan-400 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 border-t border-white/5 space-y-2 bg-black/20">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.reply)}
                disabled={isStreaming}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all group text-left disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-white/50 transition-colors">
                    <action.icon size={14} />
                  </div>
                  <span className="text-xs text-white/70 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </div>
                <ChevronRight
                  size={14}
                  className="text-white/20 group-hover:text-cyan-400 transition-colors"
                />
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/40">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask MALPHOR a question..."
                disabled={isStreaming}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
