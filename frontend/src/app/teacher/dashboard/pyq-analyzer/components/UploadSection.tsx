"use client";

import React, { useCallback, useState } from 'react';
import { Upload, X, Loader2, FileIcon, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadSectionProps {
  onAnalyze: (files: File[]) => void;
  isAnalyzing: boolean;
  isDark: boolean;
}

export function UploadSection({ onAnalyze, isAnalyzing, isDark }: UploadSectionProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-rose-400" />;
    if (type.includes('image')) return <ImageIcon className="w-6 h-6 text-blue-400" />;
    return <FileIcon className="w-6 h-6 text-gray-400" />;
  };

  // Handle Ctrl+V Paste
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const newFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('pdf') !== -1) {
          const file = items[i].getAsFile();
          if (file) newFiles.push(file);
        }
      }
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className={`w-full md:w-1/3 shrink-0 rounded-2xl p-6 border flex flex-col h-fit ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
    >
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex-1 flex flex-col items-center justify-center relative overflow-hidden ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-500/10' 
            : isDark 
              ? 'border-white/10 hover:bg-white/5 hover:border-emerald-500/50' 
              : 'border-black/10 hover:bg-black/5 hover:border-emerald-500/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload-multiple')?.click()}
      >
        <input 
          id="file-upload-multiple" 
          type="file" 
          className="hidden" 
          multiple
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
        />
        
        {isDragging && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm z-10 flex items-center justify-center">
            <h3 className="text-2xl font-bold text-emerald-500 drop-shadow-md">Drop Files Here!</h3>
          </div>
        )}

        <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-emerald-400" />
        </div>
        
        <h3 className="text-lg font-semibold mb-1">Upload Papers</h3>
        <p className={`text-xs mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Drag & drop, click, or paste (Ctrl+V)
        </p>
        <p className={`text-[10px] font-mono mb-4 px-2 py-1 rounded bg-black/5 ${isDark ? 'text-white/40 bg-white/5' : 'text-black/40'}`}>
          Supports: PDF, JPG, PNG, WEBP
        </p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2"
          >
            {files.map((f, i) => (
              <motion.div 
                key={`${f.name}-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'}`}
              >
                {getFileIcon(f.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs opacity-50">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={(e) => removeFile(i, e)}
                  className={`p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-colors ${isDark ? 'hover:bg-rose-500/20 hover:text-rose-400' : 'hover:bg-rose-100 hover:text-rose-500'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6">
        <button 
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-all text-sm ${
            (files.length === 0 || isAnalyzing) 
              ? 'bg-emerald-600/50 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/20'
          }`}
          onClick={(e) => { e.stopPropagation(); if (files.length > 0) onAnalyze(files); }}
          disabled={files.length === 0 || isAnalyzing}
        >
          {isAnalyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing Queue...</>
          ) : (
            <>Start Analysis {files.length > 0 ? `(${files.length})` : ''}</>
          )}
        </button>
      </div>
    </motion.div>
  );
}
