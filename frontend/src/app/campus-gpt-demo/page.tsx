'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Search, MessageSquare, Settings, Moon, Sun, LogOut, 
  Paperclip, Mic, Send, Bot, User 
} from 'lucide-react';
import Link from 'next/link';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

import { LoginModal } from '@/components/campus-gpt/LoginModal';

export default function CampusGPTDemo() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Auth & Limits
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [token, setToken] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check local storage for token on mount
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);

    const savedChats = localStorage.getItem('campusGptChats');
    if (savedChats) setChats(JSON.parse(savedChats));

    const savedChatId = localStorage.getItem('campusGptCurrentChatId');
    if (savedChatId) setCurrentChatId(savedChatId);

    const savedCount = localStorage.getItem('campusGptGuestCount');
    if (savedCount) setGuestMessageCount(parseInt(savedCount, 10));
  }, []);

  // Set messages based on loaded currentChatId
  useEffect(() => {
    if (currentChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
      }
    }
  }, [currentChatId]); // Only run when currentChatId changes, otherwise setting messages causes infinite loops if not careful

  // Save states to local storage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('campusGptChats', JSON.stringify(chats));
    }
  }, [chats]);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('campusGptCurrentChatId', currentChatId);
    } else {
      localStorage.removeItem('campusGptCurrentChatId');
    }
  }, [currentChatId]);

  useEffect(() => {
    localStorage.setItem('campusGptGuestCount', guestMessageCount.toString());
  }, [guestMessageCount]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleSelectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check Guest Limit
    if (!token && guestMessageCount >= 4) {
      setShowLoginModal(true);
      return;
    }

    const userMsg = input.trim();
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
    
    const activeChatId = currentChatId || Date.now().toString();
    if (!currentChatId) {
      setCurrentChatId(activeChatId);
      setChats(prev => [{ id: activeChatId, title: userMsg.slice(0, 25) + (userMsg.length > 25 ? '...' : ''), messages: [newUserMsg] }, ...prev]);
    } else {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, newUserMsg] } : c));
    }

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);
    
    if (!token) {
      setGuestMessageCount(prev => prev + 1);
    }

    try {
      // If no token, we simulate the backend for the demo limit, otherwise call real backend.
      // Actually, user requested "replace demo responses with real backend". 
      // We will call backend. If guest, backend will reject with 401 if protect middleware is on.
      // Wait, the backend /api/chat is protected! We need to bypass or allow guests on backend.
      // Or we can mock the 4 questions strictly on frontend as requested, since guest has no JWT.
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMsg, chatId: activeChatId, mode: 'STUDENT' })
      });
      
      const data = await res.json();
      let responseContent = data.reply || data.error || "Error connecting to AI backend.";

      const newAsstMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: responseContent };
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, newAsstMsg] } : c));
      setMessages(prev => [...prev, newAsstMsg]);
      setIsTyping(false);

    } catch (error) {
      setIsTyping(false);
      console.error(error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={`relative z-50 flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0c] text-[#f5f5f7]' : 'bg-[#f0f0f5] text-[#1a1a1c]'}`}>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        isDarkMode={isDarkMode} 
      />

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`flex flex-col w-[260px] h-full flex-shrink-0 border-r ${isDarkMode ? 'bg-[#1a1a1c] border-white/5' : 'bg-[#e4e4eb] border-black/5'} p-3 z-50`}
          >
            <div className="flex items-center justify-between mb-4 px-2 pt-2">
              <span className="font-bold text-lg tracking-tight">CampusGPT</span>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden opacity-70 hover:opacity-100">
                <X size={20} />
              </button>
            </div>

            <button onClick={handleNewChat} className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-colors ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}>
              <span className="text-xl">+</span>
              <span className="font-medium text-sm">New Chat</span>
            </button>

            <div className="mt-6 flex-1 overflow-y-auto overflow-x-hidden space-y-2 pr-2">
              <div className="px-2 text-xs font-semibold opacity-50 mb-3">Recent Chats</div>
              {chats.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left truncate text-sm p-2 rounded-md transition-colors ${
                    currentChatId === chat.id 
                      ? (isDarkMode ? 'bg-white/10' : 'bg-black/10') 
                      : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5')
                  } opacity-80 hover:opacity-100`}
                >
                  <MessageSquare size={14} className="inline mr-2 opacity-60" />
                  {chat.title}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t space-y-1">
              <div className={`border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'} mb-4`} />
              <button className={`flex items-center gap-3 w-full p-2 rounded-md text-sm transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                <Settings size={16} /> Settings
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`flex items-center gap-3 w-full p-2 rounded-md text-sm transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} 
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </button>
              <Link href="/">
                <button className={`flex items-center gap-3 w-full p-2 rounded-md text-sm transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <LogOut size={16} /> Exit Demo
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* TOP BAR */}
        <header className={`h-14 flex items-center justify-between px-4 border-b ${isDarkMode ? 'border-white/5 bg-[#0a0a0c]/80' : 'border-black/5 bg-[#f0f0f5]/80'} backdrop-blur-md sticky top-0 z-40`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="opacity-70 hover:opacity-100 transition-opacity">
                <Menu size={20} />
              </button>
            )}
            <div className={`px-3 py-1.5 rounded-md text-sm font-medium ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} transition-colors cursor-pointer select-none`}>
              CampusGPT Student ▾
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
              U
            </div>
          </div>
        </header>

        {/* CHAT MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 py-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-70">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                <Bot size={32} color="white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">How can CampusGPT help you today?</h2>
              <p className="text-sm opacity-60">This is a frontend demo. Try asking about DBMS, OS, or Python.</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto w-full pb-32">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                        <Bot size={16} color="white" />
                      </div>
                    )}
                    
                    <div className={`px-5 py-3.5 rounded-2xl max-w-[80%] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? (isDarkMode ? 'bg-[#2a2a2c] text-white' : 'bg-[#e4e4eb] text-black')
                        : (isDarkMode ? 'bg-transparent text-white border border-white/10' : 'bg-white text-black border border-black/5')
                    }`}>
                      {msg.content}
                    </div>

                    {msg.role === 'user' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md font-bold text-xs ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                        U
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 justify-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                      <Bot size={16} color="white" />
                    </div>
                    <div className={`px-5 py-3.5 rounded-2xl flex items-center gap-1 ${isDarkMode ? 'bg-transparent border border-white/10' : 'bg-white border border-black/5'}`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t ${isDarkMode ? 'from-[#0a0a0c] via-[#0a0a0c]' : 'from-[#f0f0f5] via-[#f0f0f5]'} to-transparent pb-8 pt-12 pointer-events-none`}>
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className={`relative flex items-center rounded-2xl border shadow-lg ${isDarkMode ? 'bg-[#1a1a1c] border-white/10 shadow-black/50' : 'bg-white border-black/10 shadow-black/5'} overflow-hidden focus-within:ring-1 focus-within:ring-blue-500/50 transition-shadow p-1`}>
              <button className={`p-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                <Paperclip size={20} />
              </button>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your studies..."
                className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-sm md:text-base"
              />
              <button className={`p-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity mr-1 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                <Mic size={20} />
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`p-3 rounded-xl transition-all ${input.trim() && !isTyping ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : 'opacity-30 cursor-not-allowed'} ${isDarkMode && input.trim() && !isTyping ? 'hover:bg-gray-200' : ''}`}
              >
                <Send size={18} className={input.trim() && !isTyping ? 'translate-x-0.5 -translate-y-0.5' : ''} />
              </button>
            </div>
            <div className="text-center mt-3 text-xs opacity-50">
              CampusGPT can make mistakes. Consider verifying important information.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
