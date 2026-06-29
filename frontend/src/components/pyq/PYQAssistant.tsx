import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface PYQAssistantProps {
  paperId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PYQAssistant({ paperId, isOpen, onClose }: PYQAssistantProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Reset chat when a new paper is selected
  useEffect(() => {
    setChatMessages([]);
  }, [paperId]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || !paperId) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paperId, message: userMsg.content, history: chatMessages })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      console.error(err);
    }
    setChatLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`fixed right-6 bottom-6 w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden flex flex-col ${
            isDark ? 'bg-[#111113] border-white/10 shadow-black/50' : 'bg-white border-black/10 shadow-xl'
          }`}
          style={{ height: '500px' }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">PYQ Assistant</h3>
                <p className="text-[10px] opacity-60">Ask about this question paper</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-6">
                <Bot size={32} className="mb-3 opacity-40" />
                <p className="text-xs">Hi! I can analyze questions, compare topics, or generate new ones from this paper.</p>
              </div>
            )}
            
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <Bot size={12} />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? (isDark ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-blue-500 text-white rounded-br-sm')
                    : (isDark ? 'bg-white/5 border border-white/5 rounded-bl-sm prose prose-sm prose-invert max-w-none' : 'bg-black/5 border border-black/5 rounded-bl-sm prose prose-sm max-w-none')
                }`}>
                  {msg.role === 'assistant' ? (
                    <MarkdownRenderer content={msg.content} messageId={`pyq-${i}`} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex gap-2 justify-start">
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  <Bot size={12} />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <Loader2 size={14} className="animate-spin opacity-50" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`p-3 border-t flex gap-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'}`}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
              placeholder="Ask a question..."
              className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-colors border ${
                isDark ? 'bg-black/40 border-white/10 focus:border-blue-500/50' : 'bg-white border-black/10 focus:border-blue-400'
              }`}
            />
            <button 
              onClick={handleChatSend} 
              disabled={!chatInput.trim() || chatLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                chatInput.trim() && !chatLoading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
