"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Plus, Send, X, FileText, ImageIcon, FileSpreadsheet, Presentation, FileCode, File, Loader2, CheckCircle2, AlertCircle, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadedFile } from './types';
import { ModelSelector } from '@/components/chat/ModelSelector';

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

interface PromptInputProps {
  isDark: boolean;
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isTyping: boolean;
  isUploadingAny: boolean;
  attachedFiles: UploadedFile[];
  removeAttachedFile: (id: string) => void;
  openDropzone: () => void;
  selectedModelId: string;
  handleModelSelect: (id: string, isPremium: boolean) => void;
}

export function PromptInput({
  isDark,
  input,
  setInput,
  handleSend,
  isTyping,
  isUploadingAny,
  attachedFiles,
  removeAttachedFile,
  openDropzone,
  selectedModelId,
  handleModelSelect
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isReadyToSend = (input.trim() || attachedFiles.filter(f => f.status === 'ready').length > 0) && !isTyping && !isUploadingAny;

  return (
    <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t ${isDark ? 'from-[#0a0a0c] via-[#0a0a0c]' : 'from-[#f8f9fa] via-[#f8f9fa]'} to-transparent pb-6 pt-32 pointer-events-none`}>
      <div className="max-w-4xl mx-auto pointer-events-auto">
        
        {/* Advanced File Cards UI */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-3 mb-4 overflow-x-auto pb-2 custom-scrollbar"
            >
              {attachedFiles.map(file => (
                <motion.div 
                  key={file.id} 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  className={`relative flex-shrink-0 w-64 p-3 rounded-2xl border shadow-xl group ${
                    isDark ? 'bg-[#1a1a1c]/90 border-white/10 backdrop-blur-md' : 'bg-white/90 border-black/10 backdrop-blur-md'
                  } ${file.status === 'error' ? 'border-red-500/50' : ''}`}
                >
                  <button 
                    title="Remove file"
                    aria-label="Remove file"
                    onClick={() => removeAttachedFile(file.id)} 
                    className={`absolute -top-3 -right-3 p-1.5 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 ${
                      isDark ? 'bg-[#2a2a2c] text-white hover:bg-red-500' : 'bg-white text-black hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <X size={14} />
                  </button>
                  
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}>
                      {file.previewUrl ? (
                        <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        getFileIcon(file.name, "w-6 h-6")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate mb-0.5">{file.name}</p>
                      <p className="text-[10px] opacity-50 truncate font-medium">{formatBytes(file.size)}</p>
                      
                      <div className="mt-2 flex items-center gap-1.5">
                        {file.status === 'uploading' && (
                          <><Loader2 size={12} className="animate-spin text-indigo-400" /><span className="text-[10px] font-bold tracking-wide text-indigo-400">UPLOADING...</span></>
                        )}
                        {file.status === 'extracting' && (
                          <><Loader2 size={12} className="animate-spin text-purple-400" /><span className="text-[10px] font-bold tracking-wide text-purple-400">PROCESSING...</span></>
                        )}
                        {file.status === 'ready' && (
                          <><CheckCircle2 size={12} className="text-emerald-400" /><span className="text-[10px] font-bold tracking-wide text-emerald-400">READY</span></>
                        )}
                        {file.status === 'error' && (
                          <><AlertCircle size={12} className="text-red-400" /><span className="text-[10px] font-bold tracking-wide text-red-400 truncate max-w-[100px]" title={file.error}>{file.error}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Input Bar and Model Selector */}
        <div className="flex flex-col gap-2 relative">
          <div className="flex justify-between items-center px-4 py-2 bg-gradient-to-r from-transparent via-[#f8f9fa] to-transparent dark:via-[#1a1a1c] border-b border-black/5 dark:border-white/5 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <ModelSelector 
              selectedModelId={selectedModelId}
              onModelSelect={handleModelSelect}
            />
            {/* System Status Indicator */}
            <div className="flex items-center gap-1.5" title="System Connected & Operational">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Connected</span>
            </div>
          </div>
          
          <div className="text-[9px] opacity-40 font-bold tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Powered by MALPHOR AI Router
            </div>
          </div>

          <div className={`relative flex items-end rounded-3xl border shadow-xl overflow-hidden ${
            isDark ? 'bg-[#1a1a1c] border-white/10 shadow-black/50' : 'bg-white border-black/10 shadow-black/5'
          } focus-within:ring-1 focus-within:border-indigo-500/50 focus-within:ring-indigo-500/20 transition-all p-2`}>
            
            <button
              onClick={openDropzone}
              className={`p-3 rounded-2xl transition-all opacity-70 hover:opacity-100 shrink-0 mb-1 ml-1 ${isDark ? 'hover:bg-white/10 bg-white/5' : 'hover:bg-black/5 bg-black/5'}`}
              title="Attach files (PDF, DOCX, Excel, Images)"
            >
              <Plus size={20} />
            </button>

            <textarea
              id="chat-prompt-input"
              ref={textareaRef}
              title="Chat input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask CampusGPT anything... (Shift+Enter for new line)"
              className="flex-1 bg-transparent border-none outline-none px-4 py-3.5 text-[15px] resize-none max-h-[200px] overflow-y-auto custom-scrollbar leading-relaxed"
              rows={1}
            />
            
            <div className="flex items-center shrink-0 mb-0.5 mr-0.5 gap-1 relative">
              {/* Animated recording waves */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -left-12 flex items-center gap-0.5 h-full px-2 pointer-events-none"
                  >
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['8px', '20px', '8px'] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1 bg-rose-500 rounded-full"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                title={isRecording ? "Stop recording" : "Voice dictation"}
                aria-label="Voice dictation"
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3.5 rounded-2xl transition-all flex items-center gap-2 ${
                  isRecording 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                    : (isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-black/40 hover:text-black hover:bg-black/5')
                }`}
              >
                <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
              </button>

              <button
                title="Send message"
                aria-label="Send message"
                onClick={handleSend}
                disabled={!isReadyToSend}
                className={`p-3.5 rounded-2xl transition-all flex items-center gap-2 ${
                  isReadyToSend
                    ? (isDark ? 'bg-white text-black hover:bg-gray-200 hover:scale-105 active:scale-95' : 'bg-black text-white hover:bg-gray-800 hover:scale-105 active:scale-95')
                    : 'opacity-30 cursor-not-allowed bg-transparent'
                }`}
              >
                <Send size={18} className={isReadyToSend ? '' : 'text-gray-500'} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-3 px-2">
          <div className="text-[11px] opacity-40 font-medium">
            CampusGPT can make mistakes. Verify important information.
          </div>
          <div className="text-[10px] opacity-30 font-medium hidden md:flex items-center gap-3">
            <span><kbd className="font-sans border rounded px-1 border-current opacity-70">⌘</kbd> + <kbd className="font-sans border rounded px-1 border-current opacity-70">K</kbd> Focus Input</span>
            <span><kbd className="font-sans border rounded px-1 border-current opacity-70">⌘</kbd> + <kbd className="font-sans border rounded px-1 border-current opacity-70">\</kbd> Toggle Sidebar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
