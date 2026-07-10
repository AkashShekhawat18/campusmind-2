"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Bot, X, Send, Loader2, Copy, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PYQChatbotProps {
  chatType: 'GLOBAL' | 'PAPER';
  analysisId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PYQChatbot({ chatType, analysisId, isOpen, onClose }: PYQChatbotProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: chatType === 'GLOBAL' 
        ? "Hello! I am your **Global PYQ AI**. I have access to your entire historical library of question papers. Ask me about trends, repeated topics, or to generate a new question paper based on history!"
        : "Hello! I am analyzing **this specific paper**. I can solve its questions, explain its concepts, or generate replacement questions for you."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem("teacherToken");
      const endpoint = chatType === 'GLOBAL' 
        ? 'http://localhost:5000/api/pyq/chat/global'
        : `http://localhost:5000/api/pyq/chat/paper/${analysisId}`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg, sessionId })
      });

      if (!response.ok) throw new Error("Failed to connect to AI");

      const newSessionId = response.headers.get('X-Session-ID');
      if (newSessionId && !sessionId) setSessionId(newSessionId);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done && reader) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.replace('data: ', '').trim());
                if (data.text) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.content += data.text;
                    return newMessages;
                  });
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        lastMsg.content = "Sorry, I encountered an error. Please try again.";
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className={`fixed bottom-6 right-6 w-[400px] h-[600px] flex flex-col rounded-2xl border shadow-2xl z-50 overflow-hidden ${
          isDark ? 'bg-[#111113]/95 border-white/10 backdrop-blur-xl' : 'bg-white/95 border-black/10 backdrop-blur-xl'
        }`}
      >
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${chatType === 'GLOBAL' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {chatType === 'GLOBAL' ? 'Global PYQ AI' : 'Paper Analysis AI'}
              </h3>
              <p className="text-[10px] opacity-60">
                {chatType === 'GLOBAL' ? 'Accessing entire PYQ library' : 'Analyzing current paper only'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm relative group ${
                msg.role === 'user' 
                  ? (isDark ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-emerald-500 text-white rounded-br-sm')
                  : (isDark ? 'bg-white/10 rounded-bl-sm' : 'bg-black/5 rounded-bl-sm')
              }`}>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => handleCopy(msg.content)}
                    className="absolute -right-8 top-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-black/20"
                    title="Copy response"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={`p-3 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-black/50 border-white/10 focus-within:border-emerald-500/50' : 'bg-white border-black/10 focus-within:border-emerald-500/50'}`}>
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={chatType === 'GLOBAL' ? "Ask about PYQ trends..." : "Ask about this paper..."}
              className="flex-1 bg-transparent border-none outline-none text-sm px-1"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-1.5 rounded-lg transition-colors ${
                input.trim() && !isLoading 
                  ? 'bg-emerald-500 text-white' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
