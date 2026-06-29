import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default function PYQAssistantPanel({ paperId, onClose }: { paperId: string, onClose: () => void }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your AI PYQ Assistant. I can help you analyze patterns across historical papers, suggest completely fresh questions, and summarize topic trends. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/teacher/pyq/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paperId,
          message: userMessage,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the AI semantic engine.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error.' }]);
    }
    
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className={`fixed z-50 shadow-2xl flex flex-col border overflow-hidden ${
          isExpanded 
            ? 'top-4 right-4 bottom-4 w-full md:w-[600px] rounded-3xl' 
            : 'bottom-4 right-4 w-[380px] h-[550px] rounded-3xl'
        } ${isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-black/10'}`}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/10 bg-black/40' : 'border-black/10 bg-gray-50'}`}>
          <div className="flex items-center gap-2">
            <Bot className="text-blue-500" size={20} />
            <h3 className="font-bold text-sm">Ask PYQ AI</h3>
          </div>
          <div className="flex items-center gap-2 text-current opacity-60">
            <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-blue-500 hover:opacity-100 transition-colors p-1">
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose} className="hover:text-red-500 hover:opacity-100 transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : isDark 
                    ? 'bg-white/10 text-white rounded-bl-none' 
                    : 'bg-gray-100 text-black rounded-bl-none'
              }`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={msg.content} messageId={`pyq-${i}`} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-2 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs opacity-60">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-black/40' : 'border-black/10 bg-gray-50'}`}>
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about historical patterns..."
              className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm border focus:outline-none transition-colors ${
                isDark ? 'bg-[#1a1a1c] border-white/10 focus:border-blue-500 text-white' : 'bg-white border-black/10 focus:border-blue-400 text-black'
              }`}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
