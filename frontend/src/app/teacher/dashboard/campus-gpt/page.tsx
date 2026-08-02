"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useDropzone } from 'react-dropzone';
import { File } from 'lucide-react';
import { PremiumLockPopup } from '@/components/chat/PremiumLockPopup';

import { ChatSession, Message, UploadedFile } from './components/types';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatArea } from './components/ChatArea';
import { PromptInput } from './components/PromptInput';
import { DocumentSidebar } from './components/DocumentSidebar';

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
  const [selectedModelId, setSelectedModelId] = useState<string>('auto');
  const [showPremiumLock, setShowPremiumLock] = useState(false);
  
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [isDocSidebarOpen, setIsDocSidebarOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;
  const userId = (typeof window !== 'undefined' && localStorage.getItem('teacherId')) || 'demo-user';

  useEffect(() => {
    setMounted(true);
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/teacher/chat/history', {
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
    setInput('');
  };

  const handleSelectChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setAttachedFiles([]);
  };

  const uploadFile = async (file: File, id: string) => {
    let chatId = currentChatId;
    if (!chatId) {
      chatId = `chat_${Date.now()}`;
      setCurrentChatId(chatId);
    }

    const formData = new FormData();
    formData.append('files', file);
    formData.append('user_id', userId);
    formData.append('chat_id', chatId);

    try {
      setTimeout(() => {
        setAttachedFiles(prev => prev.map(f => f.id === id && f.status === 'uploading' ? { ...f, status: 'extracting' } : f));
      }, 500);

      const res = await fetch('/api/ai/upload', {
        method: 'POST',
        body: formData
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server error`);
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
      setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: 'Network error' } : f));
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      status: 'uploading',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);

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

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        onDrop(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onDrop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if the user is typing in an input (except for specific shortcuts)
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Cmd/Ctrl + K or Cmd/Ctrl + / : Focus chat input
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === '/')) {
        e.preventDefault();
        const input = document.getElementById('chat-prompt-input');
        if (input) input.focus();
      }

      // Cmd/Ctrl + Shift + O : New chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewChat();
      }

      // Cmd/Ctrl + \ : Toggle Chat Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsChatSidebarOpen(prev => !prev);
      }

      // Cmd/Ctrl + . : Toggle Document Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setIsDocSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const isUploadingAny = attachedFiles.some(f => f.status === 'uploading' || f.status === 'extracting');

  const handleSendSuggestion = (prompt: string) => {
    setInput(prompt);
    // Use setTimeout to ensure state is updated before sending
    setTimeout(() => {
      executeSend(prompt, attachedFiles);
    }, 10);
  };

  const handleEditMessage = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      const inputEl = document.getElementById('chat-prompt-input');
      if (inputEl) {
        inputEl.focus();
      }
    }, 50);
  };

  const handleSend = () => {
    executeSend(input, attachedFiles);
  };

  const executeSend = async (currentInput: string, currentFiles: UploadedFile[]) => {
    const readyFiles = currentFiles.filter(f => f.status === 'ready');
    if ((!currentInput.trim() && readyFiles.length === 0) || isTyping || isUploadingAny) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: currentInput.trim() || 'Please analyze the attached file(s).',
      files: [...readyFiles]
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setAttachedFiles(prev => prev.filter(f => f.status !== 'ready'));
    setIsTyping(true);

    const asstMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: asstMsgId, role: 'assistant', content: '' }]);

    try {
      const messagePayload = readyFiles.length > 0 
        ? `${userMsg.content} (Attached document: ${readyFiles.map(f => f.name).join(', ')})` 
        : userMsg.content;

      const formData = new URLSearchParams();
      formData.append('message', messagePayload);
      formData.append('user_id', userId);
      formData.append('model_id', selectedModelId);
      if (currentChatId) formData.append('chat_id', currentChatId);
      
      const historyForPython = currentChatId ? updatedMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })) : [];
      formData.append('history', JSON.stringify(historyForPython));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const res = await fetch('/api/ai-router/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Stream failed');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedResponse = '';

      if (reader) {
        let sseBuffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'token' && data.content) {
                  streamedResponse += data.content;
                  setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: streamedResponse } : m));
                } else if (data.type === 'error') {
                  setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: `Error: ${data.content}` } : m));
                  break;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      if (!streamedResponse.trim()) {
        streamedResponse = "⚠️ No response received from AI model.";
        setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, content: streamedResponse } : m));
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

      try {
        const saveRes = await fetch('/api/teacher/chat/save', {
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
          if (activeChatId && activeChatId.startsWith('chat_')) {
            setCurrentChatId(saveData.chatId);
            setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, id: saveData.chatId } : c));
          }
        }
      } catch (saveErr) {}

    } catch (err) {
      setMessages(prev => prev.map(m => m.id === asstMsgId && !m.content ? { ...m, content: 'Connection error' } : m));
    } finally {
      setIsTyping(false);
    }
  };

  const handleRename = async (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editTitle } : c));
    setEditingChatId(null);
  };

  const handleDelete = async (chatId: string) => {
    try {
      await fetch(`/api/teacher/chat/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) handleNewChat();
  };

  const handleModelSelect = (id: string, isPremium: boolean) => {
    if (isPremium && !token) {
      setShowPremiumLock(true);
      return;
    }
    setSelectedModelId(id);
  };

  return (
    <div className={`flex h-[calc(100vh-3.5rem)] overflow-hidden ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f8f9fa]'}`} {...getRootProps()}>
      <PremiumLockPopup isOpen={showPremiumLock} onClose={() => setShowPremiumLock(false)} />
      <input title="File upload" placeholder="Upload files" aria-label="Upload files" {...getInputProps()} />
      
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-[#111113] border border-indigo-500/50 rounded-3xl p-12 flex flex-col items-center shadow-2xl shadow-indigo-500/20">
              <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                <File size={48} className="text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Drop files to attach</h2>
              <p className="text-white/60 text-center max-w-sm font-medium">
                PDFs, DOCX, TXT, Excel, PPT, and Images are supported.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatSidebar
        isDark={isDark}
        isOpen={isChatSidebarOpen}
        setIsOpen={setIsChatSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleNewChat={handleNewChat}
        handleSelectChat={handleSelectChat}
        editingChatId={editingChatId}
        setEditingChatId={setEditingChatId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        handleRename={handleRename}
        handleDelete={handleDelete}
      />

      <div className="flex-1 flex h-full relative z-10 overflow-hidden">
        <div className="flex-1 flex flex-col h-full relative z-10">
          <ChatArea
            isDark={isDark}
            messages={messages}
            isTyping={isTyping}
            openDropzone={open}
            onSendSuggestion={handleSendSuggestion}
            onEditMessage={handleEditMessage}
          />
          
          <PromptInput
            isDark={isDark}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            isTyping={isTyping}
            isUploadingAny={isUploadingAny}
            attachedFiles={attachedFiles}
            removeAttachedFile={removeAttachedFile}
            openDropzone={open}
            selectedModelId={selectedModelId}
            handleModelSelect={handleModelSelect}
          />
        </div>

        <DocumentSidebar 
          isDark={isDark}
          isOpen={isDocSidebarOpen}
          setIsOpen={setIsDocSidebarOpen}
          // Pass all files that have ever been uploaded to this chat context
          files={messages.flatMap(m => m.files || [])}
        />
      </div>
    </div>
  );
}
