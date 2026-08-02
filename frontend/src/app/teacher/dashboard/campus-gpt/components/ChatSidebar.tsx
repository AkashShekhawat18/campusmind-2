"use client";

import React, { useMemo, useState } from 'react';
import { Plus, Search, MessageSquare, Edit3, Trash2, Check, X, PanelLeftClose, Download } from 'lucide-react';
import { ChatSession } from './types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ChatSidebarProps {
  isDark: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  chats: ChatSession[];
  currentChatId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleNewChat: () => void;
  handleSelectChat: (chat: ChatSession) => void;
  editingChatId: string | null;
  setEditingChatId: (id: string | null) => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  handleRename: (chatId: string) => void;
  handleDelete: (chatId: string) => void;
}

export function ChatSidebar({
  isDark,
  isOpen,
  setIsOpen,
  chats,
  currentChatId,
  searchQuery,
  setSearchQuery,
  handleNewChat,
  handleSelectChat,
  editingChatId,
  setEditingChatId,
  editTitle,
  setEditTitle,
  handleRename,
  handleDelete
}: ChatSidebarProps) {
  
  const [chatToDelete, setChatToDelete] = useState<{ id: string, title: string } | null>(null);

  const handleExportChat = () => {
    if (!currentChatId) return;
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;

    let mdContent = `# ${chat.title}\n\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    chat.messages.forEach(msg => {
      const roleName = msg.role === 'user' ? 'You' : 'CampusGPT';
      mdContent += `### ${roleName}\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const groupedChats = useMemo(() => {
    const filtered = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const groups = {
      'Today': [] as ChatSession[],
      'Yesterday': [] as ChatSession[],
      'Previous 7 Days': [] as ChatSession[],
      'Older': [] as ChatSession[]
    };

    filtered.forEach(chat => {
      if (!chat.createdAt) {
        groups['Today'].push(chat);
        return;
      }
      
      const chatDate = new Date(chat.createdAt);
      if (isNaN(chatDate.getTime())) {
        groups['Today'].push(chat);
        return;
      }

      if (chatDate >= today) {
        groups['Today'].push(chat);
      } else if (chatDate >= yesterday) {
        groups['Yesterday'].push(chat);
      } else if (chatDate >= last7Days) {
        groups['Previous 7 Days'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });

    return groups;
  }, [chats, searchQuery]);

  if (!isOpen) {
    return (
      <div className={`w-[60px] flex-shrink-0 flex flex-col items-center py-4 border-r h-full z-20 transition-colors ${
        isDark ? 'bg-[#111113] border-white/5' : 'bg-[#f8f9fa] border-black/5'
      }`}>
        <button
          title="Open Sidebar (Ctrl+\)"
          onClick={() => setIsOpen(true)}
          className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white/50 hover:text-white' : 'hover:bg-black/5 text-black/50 hover:text-black'}`}
        >
          <PanelLeftClose size={20} className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-[280px] flex-shrink-0 flex flex-col border-r h-full z-20 transition-colors ${
      isDark ? 'bg-[#111113] border-white/5' : 'bg-[#f8f9fa] border-black/5'
    }`}>
      {/* Header Actions */}
      <div className="p-4 flex items-center gap-2">
        <button
          onClick={handleNewChat}
          className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-black/10 bg-white hover:bg-black/5 text-black shadow-sm'
          }`}
        >
          <Plus size={16} />
          <span className="text-sm">New Chat</span>
        </button>
        <button
          title="Export current chat"
          onClick={handleExportChat}
          disabled={!currentChatId}
          className={`p-2.5 rounded-xl border transition-colors ${
            !currentChatId 
              ? 'opacity-30 cursor-not-allowed border-transparent bg-transparent' 
              : (isDark ? 'border-white/10 hover:bg-white/10 text-white/50 hover:text-white' : 'border-black/10 bg-white hover:bg-black/5 text-black/50 hover:text-black shadow-sm')
          }`}
        >
          <Download size={18} />
        </button>
        <button
          title="Close Sidebar (Ctrl+\)"
          onClick={() => setIsOpen(false)}
          className={`p-2.5 rounded-xl border transition-colors ${
            isDark ? 'border-white/10 hover:bg-white/10 text-white/50 hover:text-white' : 'border-black/10 bg-white hover:bg-black/5 text-black/50 hover:text-black shadow-sm'
          }`}
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 ${
          isDark ? 'bg-white/5 border-transparent focus-within:bg-black/20' : 'bg-black/5 border-transparent focus-within:bg-white'
        }`}>
          <Search size={14} className="opacity-40 shrink-0" />
          <input
            title="Search chats"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-50"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-6 custom-scrollbar" data-lenis-prevent>
        {Object.entries(groupedChats).map(([groupName, groupChats]) => {
          if (groupChats.length === 0) return null;
          
          return (
            <div key={groupName} className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-3 mb-2">
                {groupName}
              </div>
              
              {groupChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                    currentChatId === chat.id
                      ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-black/10 text-black shadow-sm font-medium')
                      : (isDark ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-black/60 hover:bg-black/5 hover:text-black')
                  }`}
                >
                  {editingChatId === chat.id ? (
                    <div className="flex items-center gap-2 flex-1 bg-black/20 dark:bg-black/40 rounded p-1 -ml-1">
                      <input
                        title="Edit chat title"
                        placeholder="Chat title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-xs px-1"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(chat.id)}
                      />
                      <button title="Confirm rename" aria-label="Confirm rename" onClick={() => handleRename(chat.id)} className="hover:bg-white/10 rounded p-0.5">
                        <Check size={14} className="text-emerald-500" />
                      </button>
                      <button title="Cancel rename" aria-label="Cancel rename" onClick={() => setEditingChatId(null)} className="hover:bg-white/10 rounded p-0.5">
                        <X size={14} className="text-rose-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <MessageSquare size={14} className={`shrink-0 transition-opacity ${currentChatId === chat.id ? 'opacity-100' : 'opacity-40'}`} />
                      <span className="flex-1 truncate text-[13px]" onClick={() => handleSelectChat(chat)}>
                        {chat.title}
                      </span>
                      
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                        <button 
                          title="Rename chat" 
                          aria-label="Rename chat" 
                          onClick={(e) => { e.stopPropagation(); setEditingChatId(chat.id); setEditTitle(chat.title); }}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-white/20' : 'hover:bg-black/10'}`}
                        >
                          <Edit3 size={12} className="opacity-60 hover:opacity-100" />
                        </button>
                        <button 
                          title="Delete chat" 
                          aria-label="Delete chat" 
                          onClick={(e) => { e.stopPropagation(); setChatToDelete({ id: chat.id, title: chat.title }); }}
                          className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-500'}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {chats.length === 0 && (
          <div className="px-4 py-8 text-xs text-center opacity-50 flex flex-col items-center gap-3">
            <MessageSquare size={24} className="opacity-20" />
            <p>No chats found.</p>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={chatToDelete !== null}
        onClose={() => setChatToDelete(null)}
        onConfirm={() => {
          if (chatToDelete) handleDelete(chatToDelete.id);
        }}
        isDark={isDark}
        title={chatToDelete?.title}
      />
    </div>
  );
}
