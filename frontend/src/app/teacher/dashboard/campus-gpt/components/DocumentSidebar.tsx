"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, ChevronRight, CheckCircle2, AlertCircle, Loader2, HardDrive, Clock, ExternalLink } from 'lucide-react';
import { UploadedFile } from './types';

interface DocumentSidebarProps {
  isDark: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  files: UploadedFile[];
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return 'Unknown size';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function DocumentSidebar({ isDark, isOpen, setIsOpen, files }: DocumentSidebarProps) {
  // If we wanted to make this robust across historic chats, 
  // we would parse all msg.files from the currently selected chat.
  // For now, we'll just show the files attached to the current conversation context.

  return (
    <>
      {/* Toggle Button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed right-0 top-1/2 -translate-y-1/2 p-2 rounded-l-xl border-y border-l shadow-2xl transition-all hover:pr-4 ${
            isDark ? 'bg-[#111113] border-white/10 text-white/50 hover:text-white' : 'bg-white border-black/10 text-black/50 hover:text-black'
          }`}
          title="Open Document Context"
        >
          <div className="flex flex-col items-center gap-2">
            <FileText size={16} />
            {files.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                {files.length}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`w-[320px] flex-shrink-0 flex flex-col border-l h-full z-30 absolute right-0 top-0 shadow-2xl ${
              isDark ? 'bg-[#111113] border-white/5' : 'bg-[#f8f9fa] border-black/5'
            }`}
          >
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                  <HardDrive size={16} />
                </div>
                <h3 className="font-bold text-sm">Active Context</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white/50' : 'hover:bg-black/5 text-black/50'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">
                Indexed Documents ({files.length})
              </div>

              {files.length === 0 ? (
                <div className="text-center py-10 opacity-50 flex flex-col items-center gap-3">
                  <FileText size={32} className="opacity-20" />
                  <p className="text-xs max-w-[200px]">No documents attached to this conversation context.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map(file => (
                    <div 
                      key={file.id} 
                      className={`p-3 rounded-xl border group transition-all hover:shadow-md ${
                        isDark ? 'bg-black/20 border-white/5 hover:border-white/20' : 'bg-white border-black/5 hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                          isDark ? 'bg-[#1a1a1c] border-white/5' : 'bg-black/5 border-black/5'
                        }`}>
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <FileText size={18} className="text-indigo-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] opacity-50 font-medium">
                            <span className="flex items-center gap-1"><HardDrive size={10}/> {formatBytes(file.size)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock size={10}/> Just now</span>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-2">
                            {file.status === 'uploading' && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit">
                                <Loader2 size={8} className="animate-spin" /> Uploading
                              </span>
                            )}
                            {file.status === 'extracting' && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit">
                                <Loader2 size={8} className="animate-spin" /> Indexing
                              </span>
                            )}
                            {file.status === 'ready' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit">
                                <CheckCircle2 size={8} /> Indexed
                              </span>
                            )}
                            {file.status === 'error' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 w-fit">
                                <AlertCircle size={8} /> Error
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className={`p-1.5 rounded transition-colors ${isDark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-black/5 text-black/60 hover:text-black'}`} title="View Source">
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={`p-4 border-t text-[10px] text-center opacity-40 font-medium ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              Documents are processed securely via CampusMind RAG Pipeline
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
