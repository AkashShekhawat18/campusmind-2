'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useDropzone } from 'react-dropzone';
import {
  Search, MessageSquare, Plus, Send, Bot, Trash2,
  Edit3, Check, X, Copy, CheckCheck, Paperclip, FileText, Image as ImageIcon,
  FileSpreadsheet, Presentation, FileCode, File, XCircle, Loader2, CheckCircle2,
  AlertCircle
} from 'lucide-react';

type UploadStatus = 'uploading' | 'extracting' | 'ready' | 'error';

type UploadedFile = { 
  id: string; 
  name: string; 
  size?: number;
  status: UploadStatus;
  document_id?: string;
  error?: string;
  previewUrl?: string;
};

type Message = { id: string; role: 'user' | 'assistant'; content: string; files?: UploadedFile[] };
type ChatSession = { id: string; title: string; messages: Message[]; createdAt?: string };

const formatBytes = (bytes?: number) => {
  if (!bytes) return 'Unknown size';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (filename: string, className?: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf', 'txt', 'md', 'docx', 'doc'].includes(ext || '')) return <FileText className={className || "text-blue-400"} />;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className={className || "text-purple-400"} />;
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className={className || "text-green-400"} />;
  if (['pptx', 'ppt'].includes(ext || '')) return <Presentation className={className || "text-orange-400"} />;
  if (['json', 'js', 'py', 'ts', 'html', 'css'].includes(ext || '')) return <FileCode className={className || "text-yellow-400"} />;
  return <File className={className || "text-gray-400"} />;
};

export default function StudentCampusGPT() {
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
  
  // Advanced Upload States
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('studentToken') : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('studentId') : 'demo-user';

  useEffect(() => {
    setMounted(true);
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, attachedFiles]);

  const fetchChats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/student/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data.map((c: any) => ({ 
          id: c.id, 
          title: c.title, 
          messages: c.messages.map((m: any) => ({
             ...m,
             files: m.fileReferences ? JSON.parse(m.fileReferences) : []
          })), 
          createdAt: c.createdAt 
        })));
      }
    } catch (err) {
      console.error('Fetch chats error:', err);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setAttachedFiles([]);
  };

  const handleSelectChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setAttachedFiles([]);
  };

  const uploadFile = async (file: File, id: string) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('user_id', userId!);

    try {
      // Simulate fast transition from uploading to extracting for UX
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id && f.status === 'uploading' ? { ...f, status: 'extracting' } : f));
      }, 500);

      const res = await fetch('/api/ai/upload', {
        method: 'POST',
        body: formData,
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server error: ${text.substring(0, 50)}...`);
      }
      
      if (res.ok && data.results && data.results[0]?.status === 'success') {
        const result = data.results[0];
        setAttachedFiles(prev => prev.map(f => f.id === id ? { 
          ...f, 
          status: 'ready', 
          document_id: result.document_id,
          size: result.size 
        } : f));
      } else {
        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: data.results[0].reason || 'Extraction failed' } : f));
      }
    } catch (err) {
      console.error(err);
      setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'Network error' } : f));
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Immediately add all files to UI with "uploading" status
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      status: 'uploading',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);

    // Process each upload independently so UI updates per-file
    acceptedFiles.forEach((file, index) => {
      uploadFile(file, newFiles[index].id);
    });
  }, [userId]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true
  });

  // Handle Paste Event for Images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        onDrop(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onDrop]);

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const isUploadingAny = attachedFiles.some(f => f.status === 'uploading' || f.status === 'extracting');

  const handleSend = async () => {
    // Only send if there's text or fully ready files, and nothing is currently uploading
    const readyFiles = attachedFiles.filter(f => f.status === 'ready');
    if ((!input.trim() && readyFiles.length === 0) || isTyping || isUploadingAny) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input.trim() || 'Please analyze the attached file(s).',
      files: [...readyFiles]
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setAttachedFiles(prev => prev.filter(f => f.status !== 'ready')); // Clear ready files, keep errors if any
    setIsTyping(true);

    const asstMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: asstMsgId, role: 'assistant', content: '' }]);

    try {
      const formData = new URLSearchParams();
      formData.append('message', userMsg.content);
      formData.append('user_id', userId!);
      if (currentChatId) formData.append('chat_id', currentChatId);
      
      const historyForPython = updatedMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      formData.append('history', JSON.stringify(historyForPython));

      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!res.ok) throw new Error('Stream failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'token' && data.content) {
                  streamedResponse += data.content;
                  setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: streamedResponse } : m));
                }
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }

      let activeChatId = currentChatId;
      if (!currentChatId) {
        const newChatId = 'chat_' + Date.now();
        setCurrentChatId(newChatId);
        activeChatId = newChatId;
        setChats(prev => [{ id: newChatId, title: userMsg.content.slice(0, 30), messages: [...updatedMessages, { id: asstMsgId, role: 'assistant', content: streamedResponse }] }, ...prev]);
      } else {
        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...updatedMessages, { id: asstMsgId, role: 'assistant', content: streamedResponse }] } : c));
      }

      // Save to Database
      try {
        const saveRes = await fetch('http://localhost:5000/api/student/chat/save', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            chatId: activeChatId,
            title: userMsg.content.slice(0, 30),
            messages: [userMsg, { id: asstMsgId, role: 'assistant', content: streamedResponse }]
          })
        });
        
        if (saveRes.ok) {
          const saveData = await saveRes.json();
          // Update the temporary chat_id to the real database UUID if it was a new chat
          if (activeChatId.startsWith('chat_')) {
            setCurrentChatId(saveData.chatId);
            setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, id: saveData.chatId } : c));
          }
        }
      } catch (saveErr) {
        console.error('Failed to save chat to database:', saveErr);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: '⚠️ Streaming error. Check backend connection.' } : m));
    } finally {
      setIsTyping(false);
    }
  };

  const handleRename = async (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editTitle } : c));
    setEditingChatId(null);
  };

  const handleDelete = async (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`flex h-full overflow-hidden ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`} {...getRootProps()}>
      <input {...getInputProps()} />
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-[#111113] border border-blue-500/50 rounded-3xl p-12 flex flex-col items-center shadow-2xl shadow-blue-500/20">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                <File size={40} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Drop files to attach</h2>
              <p className="text-white/50 text-center max-w-sm">
                PDFs, DOCX, TXT, Excel, PPT, and Images are supported.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Sidebar */}
      <div className={`w-[260px] flex-shrink-0 flex flex-col border-r h-full z-10 ${
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
      <div className="flex-1 flex flex-col h-full relative z-10">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-60">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                <Bot size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">CampusGPT — Advanced RAG</h2>
              <p className="text-sm opacity-50 max-w-md text-center mb-8">
                Upload multiple documents, paste images directly, or drop folders to begin analyzing.
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
                <div onClick={open} className={`p-4 rounded-xl border border-dashed cursor-pointer transition-all hover:scale-105 flex flex-col items-center text-center ${isDark ? 'border-white/20 hover:border-blue-400 hover:bg-blue-500/10' : 'border-black/20 hover:border-blue-500 hover:bg-blue-50'}`}>
                  <File size={24} className="mb-2 text-blue-400" />
                  <span className="text-sm font-medium">Upload Documents</span>
                  <span className="text-xs opacity-50">PDF, DOCX, TXT, Excel</span>
                </div>
                <div onClick={open} className={`p-4 rounded-xl border border-dashed cursor-pointer transition-all hover:scale-105 flex flex-col items-center text-center ${isDark ? 'border-white/20 hover:border-purple-400 hover:bg-purple-500/10' : 'border-black/20 hover:border-purple-500 hover:bg-purple-50'}`}>
                  <Paperclip size={24} className="mb-2 text-purple-400" />
                  <span className="text-sm font-medium">Upload Images</span>
                  <span className="text-xs opacity-50">Scans, Charts, Paste (Ctrl+V)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto w-full pb-64">
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
                      
                      {/* Attached files history display */}
                      {msg.role === 'user' && msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {msg.files.map(f => (
                            <div key={f.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${isDark ? 'bg-[#111113]/50 border-white/10' : 'bg-white/50 border-black/10'}`}>
                              {getFileIcon(f.name, "w-4 h-4")}
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold max-w-[120px] truncate">{f.name}</span>
                                <span className="text-[9px] opacity-60 font-medium">DOCUMENT</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content === '' ? (
                            <span className="animate-pulse">Thinking...</span>
                          ) : (
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
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
                          )}
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md font-bold text-xs ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                        T
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input & Upload Cards */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t ${isDark ? 'from-[#0a0a0c] via-[#0a0a0c]' : 'from-[#f0f0f5] via-[#f0f0f5]'} to-transparent pb-6 pt-32 pointer-events-none`}>
          <div className="max-w-4xl mx-auto pointer-events-auto">
            
            {/* Advanced File Cards UI */}
            {attachedFiles.length > 0 && (
              <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                <AnimatePresence>
                  {attachedFiles.map(file => (
                    <motion.div 
                      key={file.id} 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                      className={`relative flex-shrink-0 w-56 p-3 rounded-2xl border shadow-lg group ${
                        isDark ? 'bg-[#1a1a1c]/90 border-white/10 backdrop-blur-md' : 'bg-white/90 border-black/10 backdrop-blur-md'
                      } ${file.status === 'error' ? 'border-red-500/50' : ''}`}
                    >
                      <button 
                        onClick={() => removeAttachedFile(file.id)} 
                        className={`absolute -top-2 -right-2 p-1 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100 ${
                          isDark ? 'bg-[#2a2a2c] text-white hover:bg-red-500' : 'bg-white text-black hover:bg-red-50 hover:text-red-500'
                        }`}
                      >
                        <X size={12} />
                      </button>
                      
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            getFileIcon(file.name, "w-6 h-6")
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate mb-0.5">{file.name}</p>
                          <p className="text-[10px] opacity-50 truncate">{formatBytes(file.size)}</p>
                          
                          <div className="mt-2 flex items-center gap-1.5">
                            {file.status === 'uploading' && (
                              <><Loader2 size={10} className="animate-spin text-blue-400" /><span className="text-[10px] font-medium text-blue-400">Uploading...</span></>
                            )}
                            {file.status === 'extracting' && (
                              <><Loader2 size={10} className="animate-spin text-purple-400" /><span className="text-[10px] font-medium text-purple-400">Processing & Chunking...</span></>
                            )}
                            {file.status === 'ready' && (
                              <><CheckCircle2 size={10} className="text-green-400" /><span className="text-[10px] font-medium text-green-400">Ready to query</span></>
                            )}
                            {file.status === 'error' && (
                              <><AlertCircle size={10} className="text-red-400" /><span className="text-[10px] font-medium text-red-400 truncate max-w-[80px]" title={file.error}>{file.error}</span></>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Chat Input Bar */}
            <div className={`relative flex items-center rounded-2xl border shadow-lg overflow-hidden ${
              isDark ? 'bg-[#1a1a1c] border-white/10 shadow-black/50' : 'bg-white border-black/10 shadow-black/5'
            } focus-within:ring-1 focus-within:ring-blue-500/50 transition-shadow p-1.5`}>
              
              <button
                onClick={open}
                className={`p-2.5 rounded-xl transition-all opacity-60 hover:opacity-100 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                title="Attach files (PDF, DOCX, Excel, Images)"
              >
                <Plus size={20} />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask CampusGPT anything or drop files here..."
                className="flex-1 bg-transparent border-none outline-none px-3 py-3 text-[15px]"
              />
              
              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachedFiles.filter(f => f.status === 'ready').length === 0) || isTyping || isUploadingAny}
                className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                  (input.trim() || attachedFiles.filter(f => f.status === 'ready').length > 0) && !isTyping && !isUploadingAny
                    ? (isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800')
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-3 text-xs opacity-40">
              CampusGPT Teacher Mode • Powered by Groq + ChromaDB RAG
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
