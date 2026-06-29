'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, ChevronRight, X, User, Users } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default function StudentAIHistory() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('http://localhost:8001/api/admin/users?role=STUDENT');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchStudents();
  }, []);

  const loadChats = async (userId: string) => {
    setSelectedUser(userId);
    setSelectedChat(null);
    setMessages([]);
    setLoadingChats(true);
    try {
      const res = await fetch(`http://localhost:8001/api/admin/chats?user_id=${userId}`);
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    setSelectedChat(chatId);
    setLoadingMessages(true);
    try {
      const res = await fetch(`http://localhost:8001/api/admin/chats/${chatId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* Student List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User size={18} /> Students
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingUsers ? (
            <div className="p-4 text-center text-gray-500">Loading students...</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No students found.</div>
          ) : (
            users.map(user => (
              <button
                key={user.id}
                onClick={() => loadChats(user.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedUser === user.id ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-sm text-white">{user.name}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
                <ChevronRight size={16} className={selectedUser === user.id ? 'text-purple-400' : 'text-gray-600'} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chats & Messages Panel */}
      <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md relative">
        {selectedUser ? (
          !selectedChat ? (
            <div className="flex flex-col h-full">
               <div className="p-4 border-b border-white/10 flex items-center gap-2">
                  <MessageSquare size={18} className="text-purple-400" />
                  <h2 className="text-lg font-semibold">Chat History</h2>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {loadingChats ? (
                   <div className="text-center text-gray-500 mt-10">Loading chats...</div>
                 ) : chats.length === 0 ? (
                   <div className="text-center text-gray-500 mt-10 flex flex-col items-center">
                     <MessageSquare size={32} className="opacity-20 mb-3" />
                     <p>This student hasn't started any Campus GPT chats.</p>
                   </div>
                 ) : (
                   chats.map(chat => (
                     <motion.div
                       key={chat.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="p-4 rounded-xl border border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                       onClick={() => loadMessages(chat.id)}
                     >
                       <div className="font-medium text-white mb-1">{chat.title}</div>
                       <div className="text-xs text-gray-500">{new Date(chat.createdAt).toLocaleString()}</div>
                     </motion.div>
                   ))
                 )}
               </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="p-1 hover:bg-white/10 rounded-lg text-gray-400">
                    <X size={18} />
                  </button>
                  <h2 className="text-lg font-semibold truncate">{chats.find(c => c.id === selectedChat)?.title}</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingMessages ? (
                  <div className="text-center text-gray-500 mt-10">Loading messages...</div>
                ) : (
                  messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.role === 'user' 
                          ? 'bg-purple-600/20 border border-purple-500/30 text-white' 
                          : 'bg-white/5 border border-white/10 text-gray-200'
                      }`}>
                        <div className="text-xs font-medium mb-2 opacity-50 uppercase tracking-wider">
                          {msg.role === 'user' ? 'Prompt' : 'AI Response'} • {new Date(msg.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="prose prose-invert max-w-none text-sm">
                           <MarkdownRenderer content={msg.content} />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
            <Users size={48} className="opacity-20 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Select a Student</h3>
            <p>Choose a student from the list to view their Campus GPT chat history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
