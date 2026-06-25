'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Search, MessageSquare, Plus, Send, Bot, User, Trash2,
  Edit3, Check, X, Copy, CheckCheck
} from 'lucide-react';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
type ChatSession = { id: string; title: string; messages: Message[]; createdAt?: string };

export default function TeacherCampusGPT() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;

  useEffect(() => {
    setMounted(true);
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchChats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data.map((c: any) => ({ id: c.id, title: c.title, messages: c.messages, createdAt: c.createdAt })));
      }
    } catch (err) {
      console.error('Fetch chats error:', err);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleSelectChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:5000/api/teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: userMsg.content,
          chatId: currentChatId,
          history: messages
        })
      });

      const data = await res.json();
      const asstMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply || 'Error' };

      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
        setChats(prev => [{ id: data.chatId, title: userMsg.content.slice(0, 30), messages: [...updatedMessages, asstMsg] }, ...prev]);
      } else {
        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...updatedMessages, asstMsg] } : c));
      }

      setMessages(prev => [...prev, asstMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: '⚠️ Network error. Check backend.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRename = async (chatId: string) => {
    try {
      await fetch(`http://localhost:5000/api/teacher/chat/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle })
      });
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editTitle } : c));
      setEditingChatId(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (chatId: string) => {
    try {
      await fetch(`http://localhost:5000/api/teacher/chat/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (err) { console.error(err); }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredChats = chats.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex h-full overflow-hidden ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      {/* Chat Sidebar */}
      <div className={`w-[260px] flex-shrink-0 flex flex-col border-r h-full ${
        isDark ? 'bg-[#111113] border-white/5' : 'bg-[#e8e8ed] border-black/5'
      }`}>
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className={`flex items-center gap-2 w-full p-3 rounded-xl border transition-all ${
              isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-black/10 hover:bg-black/5 text-black'
            }`}
          >
            <Plus size={18} />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 mb-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <Search size={14} className="opacity-40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 bg-transparent border-none outline-none text-xs"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider opacity-30 px-2 mb-2">
            Chat History
          </div>
          {filteredChats.length === 0 && (
            <div className={`text-center py-6 text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              {searchQuery ? 'No matching chats' : 'No chats yet'}
            </div>
          )}
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                currentChatId === chat.id
                  ? (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black')
                  : (isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-black/60 hover:bg-black/5 hover:text-black')
              }`}
            >
              {editingChatId === chat.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id)}
                  />
                  <button onClick={() => handleRename(chat.id)}><Check size={12} className="text-green-400" /></button>
                  <button onClick={() => setEditingChatId(null)}><X size={12} className="text-red-400" /></button>
                </div>
              ) : (
                <>
                  <MessageSquare size={14} className="opacity-40 flex-shrink-0" />
                  <span className="flex-1 truncate text-xs" onClick={() => handleSelectChat(chat)}>
                    {chat.title}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button onClick={() => { setEditingChatId(chat.id); setEditTitle(chat.title); }}>
                      <Edit3 size={12} className="opacity-40 hover:opacity-100" />
                    </button>
                    <button onClick={() => handleDelete(chat.id)}>
                      <Trash2 size={12} className="opacity-40 hover:opacity-100 text-red-400" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-60">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                <Bot size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">CampusGPT — Teacher Mode</h2>
              <p className="text-sm opacity-50 max-w-md text-center">
                Get help with lesson planning, grading rubrics, question generation, and more.
              </p>
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
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    <div className={`relative group max-w-[80%] ${
                      msg.role === 'user'
                        ? `px-5 py-3.5 rounded-2xl shadow-sm ${isDark ? 'bg-[#2a2a2c] text-white' : 'bg-[#e4e4eb] text-black'}`
                        : `px-5 py-3.5 rounded-2xl ${isDark ? 'bg-transparent text-white border border-white/10' : 'bg-white text-black border border-black/5'}`
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeStr = String(children).replace(/\n$/, '');
                                return match ? (
                                  <div className="relative group/code my-3">
                                    <button
                                      onClick={() => handleCopy(codeStr, msg.id + match[1])}
                                      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 opacity-0 group-hover/code:opacity-100 transition-opacity"
                                    >
                                      {copiedId === msg.id + match[1] ? <CheckCheck size={12} className="text-green-400" /> : <Copy size={12} />}
                                    </button>
                                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" className="rounded-xl !bg-[#1a1a1c] !text-sm">
                                      {codeStr}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className={`px-1.5 py-0.5 rounded-md text-sm ${isDark ? 'bg-white/10' : 'bg-black/10'}`} {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md font-bold text-xs ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                        T
                      </div>
                    )}
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className={`px-5 py-3.5 rounded-2xl flex items-center gap-1 ${isDark ? 'border border-white/10' : 'bg-white border border-black/5'}`}>
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

        {/* Input */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t ${isDark ? 'from-[#0a0a0c] via-[#0a0a0c]' : 'from-[#f0f0f5] via-[#f0f0f5]'} to-transparent pb-6 pt-12 pointer-events-none`}>
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className={`relative flex items-center rounded-2xl border shadow-lg overflow-hidden ${
              isDark ? 'bg-[#1a1a1c] border-white/10 shadow-black/50' : 'bg-white border-black/10 shadow-black/5'
            } focus-within:ring-1 focus-within:ring-blue-500/50 transition-shadow p-1`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask CampusGPT anything..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`p-3 rounded-xl transition-all ${
                  input.trim() && !isTyping
                    ? (isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800')
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-3 text-xs opacity-40">
              CampusGPT Teacher Mode • Powered by Groq
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
