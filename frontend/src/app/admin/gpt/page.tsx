'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Settings2, Save, User, MessageSquare, Bot } from 'lucide-react';
import LatexText from '@/components/LatexText';

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  user: { name: string; email: string; role: string };
  messages: ChatMessage[];
}

export default function AdminGPTPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'config'>('history');
  
  // History State
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  // Config State
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const hasChats = chats.length > 0;
  const hasSettings = Object.keys(settings).length > 0;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
        const res = await fetch('http://localhost:5000/api/admin/gpt/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setChats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    };

    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
        const res = await fetch('http://localhost:5000/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfig(false);
      }
    };

    if (activeTab === 'history' && !hasChats) fetchHistory();
    if (activeTab === 'config' && !hasSettings) fetchConfig();
  }, [activeTab, hasChats, hasSettings]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSavingConfig(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      // Save settings sequentially or concurrently
      await Promise.all(Object.entries(settings).map(([key, value]) => 
        fetch('http://localhost:5000/api/admin/settings', {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key, value })
        })
      ));
      alert('AI Configurations updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save configurations');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Campus GPT Controls</h1>
        <p className="text-gray-400">Monitor live AI conversations and manage model parameters.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'history' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <History size={18} /> Search History
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'config' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Settings2 size={18} /> AI Configuration
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex gap-6"
            >
              {/* Chat List */}
              <div className="w-1/3 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10 font-medium text-white">
                  Recent Conversations
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1" data-lenis-prevent>
                  {loadingHistory ? (
                    <div className="p-4 text-center text-gray-400">Loading...</div>
                  ) : chats.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">No conversations found.</div>
                  ) : (
                    chats.map(chat => (
                      <div 
                        key={chat.id} 
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 rounded-xl cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                      >
                        <h4 className="text-sm font-medium text-white truncate">{chat.title || 'New Chat'}</h4>
                        <p className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                          <span>{chat.user.name} ({chat.user.role})</span>
                          <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Details */}
              <div className="w-2/3 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                {selectedChat ? (
                  <>
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-bold text-white text-lg">{selectedChat.title || 'Untitled Conversation'}</h3>
                      <p className="text-sm text-gray-400 mt-1">Initiated by {selectedChat.user.name} ({selectedChat.user.email})</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6" data-lenis-prevent>
                      {selectedChat.messages.map(msg => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role !== 'user' && (
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                              <Bot size={16} />
                            </div>
                          )}
                          <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tr-none' : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'}`}>
                            <div className="whitespace-pre-wrap"><LatexText>{msg.content}</LatexText></div>
                            <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                              <User size={16} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p>Select a conversation from the list to view its contents.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 h-max"
            >
              <h2 className="text-xl font-bold text-white mb-6">Generation Parameters</h2>
              
              {loadingConfig ? (
                <div className="text-gray-400 py-8">Loading configurations...</div>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
                    <select 
                      title="AI Model"
                      value={settings.ai_model || 'gemini-1.5-pro'}
                      onChange={(e) => handleSettingChange('ai_model', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gpt-4o">GPT-4o (OpenAI)</option>
                      <option value="claude-3-opus">Claude 3 Opus (Anthropic)</option>
                    </select>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                      <span>Temperature</span>
                      <span className="text-purple-400">{settings.ai_temperature || '0.7'}</span>
                    </label>
                    <input 
                      title="Temperature"
                      placeholder="Temperature"
                      type="range" 
                      min="0" max="2" step="0.1" 
                      value={settings.ai_temperature || '0.7'}
                      onChange={(e) => handleSettingChange('ai_temperature', e.target.value)}
                      className="w-full accent-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">Higher values make output more random, lower values make it more focused and deterministic.</p>
                  </div>

                  {/* Top P */}
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                      <span>Top P</span>
                      <span className="text-purple-400">{settings.ai_top_p || '0.9'}</span>
                    </label>
                    <input 
                      title="Top P"
                      placeholder="Top P"
                      type="range" 
                      min="0" max="1" step="0.05" 
                      value={settings.ai_top_p || '0.9'}
                      onChange={(e) => handleSettingChange('ai_top_p', e.target.value)}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Output Tokens</label>
                    <input 
                      title="Max Output Tokens"
                      placeholder="Max Output Tokens"
                      type="number" 
                      value={settings.ai_max_tokens || '2048'}
                      onChange={(e) => handleSettingChange('ai_max_tokens', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  
                  {/* Chunk Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">RAG Chunk Size (Tokens)</label>
                    <input 
                      title="RAG Chunk Size"
                      placeholder="RAG Chunk Size"
                      type="number" 
                      value={settings.ai_chunk_size || '1024'}
                      onChange={(e) => handleSettingChange('ai_chunk_size', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-2">Used for document extraction and retrieval augmented generation.</p>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <button 
                      onClick={saveSettings}
                      disabled={savingConfig}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingConfig ? 'Saving...' : <><Save size={18} /> Save Configurations</>}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
