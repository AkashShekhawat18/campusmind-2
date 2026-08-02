'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  // basic markdown rendering or just return text for now, but usually CampusMind has a Markdown block.
  // We'll just render it as white-space pre-wrap text since we don't have react-markdown imported in this snippet directly,
  // but let's assume it's just raw text with markdown formatting for the scope of this step.
  return <div className="whitespace-pre-wrap">{content}</div>;
};

const SUGGESTIONS = [
  "Generate 5 MCQs on Sorting Algorithms",
  "Create a rubric for a lab report",
  "What is Bloom's taxonomy?",
  "Suggest a marking scheme for a 50-mark test",
];

export default function AssessmentAssistantPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: new Date() };
    
    // We send the existing history to the backend
    const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const token = localStorage.getItem('teacherToken');
      
      const res = await fetch('http://localhost:5000/api/assessment/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: msg,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (reader) {
        let isDone = false;
        while (!isDone) {
          const { done, value } = await reader.read();
          isDone = done;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;
                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === 'content') {
                    setMessages(prev => prev.map(m => 
                      m.id === assistantId ? { ...m, content: m.content + data.content } : m
                    ));
                  } else if (data.type === 'error') {
                    setMessages(prev => prev.map(m => 
                      m.id === assistantId ? { ...m, content: m.content + '\\n\\n**Error:** ' + data.content } : m
                    ));
                  }
                } catch (e) {
                  // ignore parse error on incomplete chunks
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => 
        m.id === assistantId ? { ...m, content: m.content + '\n\n*(Failed to connect to Assessment Assistant)*' } : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">AI Assessment Assistant</h1>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Dedicated to assessment creation and management only
          </p>
        </div>
        <div className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Assessment Scope
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
              <Bot size={36} className={isDark ? 'text-indigo-400/60' : 'text-indigo-600/60'} />
            </div>
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Assessment Assistant
            </h2>
            <p className={`text-sm text-center max-w-md mb-6 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              I help you create, improve, and manage assessments. Ask me anything about quizzes, rubrics, question generation, or marking schemes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className={`text-left px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                    isDark ? 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5' : 'bg-white text-black/50 hover:bg-black/5 border border-black/5'
                  }`}
                >
                  <Sparkles size={12} className={`inline mr-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
                      : (isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5')
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                        <span className={`text-xs font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Assessment Assistant</span>
                      </div>
                    )}
                    <div className="leading-relaxed">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                  <div className="flex items-center gap-2">
                    <Bot size={14} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                          className={`w-2 h-2 rounded-full ${isDark ? 'bg-white/30' : 'bg-black/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`px-6 py-4 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <div className={`flex items-end gap-3 max-w-3xl mx-auto rounded-2xl p-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/10'}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about assessments, quizzes, rubrics..."
            rows={1}
            className={`flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none ${isDark ? 'text-white placeholder-white/30' : 'text-black placeholder-black/30'}`}
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-400 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className={`text-center text-[10px] mt-2 ${isDark ? 'text-white/20' : 'text-black/20'}`}>
          This assistant is scoped to assessment tasks only. It does not replace Campus GPT.
        </p>
      </div>
    </div>
  );
}
