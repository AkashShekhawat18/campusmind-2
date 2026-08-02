"use client";

import React, { memo, useState } from 'react';
import { Bot, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Volume2, Share2, FileText, ImageIcon, FileSpreadsheet, Presentation, FileCode, File } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from './types';
import { ArtifactModal } from './ArtifactModal';

// Memoized Markdown Component for extreme performance
const MemoizedMarkdown = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children && prevProps.className === nextProps.className
);

const getFileIcon = (filename: string, className?: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf', 'txt', 'md', 'docx', 'doc'].includes(ext || '')) return <FileText className={className || "text-blue-400"} />;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext || '')) return <ImageIcon className={className || "text-purple-400"} />;
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className={className || "text-green-400"} />;
  if (['pptx', 'ppt'].includes(ext || '')) return <Presentation className={className || "text-orange-400"} />;
  if (['json', 'js', 'py', 'ts', 'html', 'css'].includes(ext || '')) return <FileCode className={className || "text-yellow-400"} />;
  return <File className={className || "text-gray-400"} />;
};

interface MessageBubbleProps {
  msg: Message;
  isDark: boolean;
  onEdit?: (content: string) => void;
}

export const MessageBubble = memo(function MessageBubble({ msg, isDark, onEdit }: MessageBubbleProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [artifactState, setArtifactState] = useState<{ isOpen: boolean; type: 'code' | 'table' | 'text'; content: string; language?: string }>({
    isOpen: false,
    type: 'code',
    content: ''
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const preprocessLatex = (text: string): string => {
    if (!text) return '';
    let processed = text.replace(/\\\( ([\s\S]*?) \\\)/g, '$$$1$$');
    processed = processed.replace(/\\\((.*?)\\\)/g, '$$$1$$');
    processed = processed.replace(/\\\[ ([\s\S]*?) \\\]/g, '$$$$\n$1\n$$$$');
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$\n$1\n$$$$');
    return processed;
  };

  const content = preprocessLatex(msg.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {msg.role === 'assistant' && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
          <Bot size={16} className="text-white" />
        </div>
      )}
      
      <div className={`relative group max-w-[85%] md:max-w-[75%] ${
        msg.role === 'user'
          ? `px-5 py-4 rounded-3xl rounded-tr-sm shadow-sm ${isDark ? 'bg-[#2a2a2c] text-white' : 'bg-black text-white'}`
          : `px-5 py-4 rounded-3xl rounded-tl-sm ${isDark ? 'bg-transparent text-white border border-white/10' : 'bg-white text-black border border-black/5 shadow-sm'}`
      }`}>
        
        {/* Attached files history display */}
        {msg.role === 'user' && msg.files && msg.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {msg.files.map(f => (
              <div key={f.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${isDark ? 'bg-[#111113]/50 border-white/10' : 'bg-white/10 border-white/20'}`}>
                {getFileIcon(f.name, "w-4 h-4")}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold max-w-[150px] truncate">{f.name}</span>
                  <span className="text-[9px] opacity-60 font-bold tracking-wider uppercase">DOCUMENT</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {msg.role === 'assistant' ? (
          <div className="w-full">
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-3 flex items-center gap-1.5">
               <Bot size={12} /> CampusGPT
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent chat-message-content">
              <MemoizedMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeStr = String(children).replace(/\n$/, '');
                    
                    // If it's a large block, show the expand option (e.g., > 10 lines)
                    const lineCount = codeStr.split('\n').length;
                    const showExpand = match && lineCount > 1;

                    return match ? (
                      <div className="relative group/code my-4 rounded-xl overflow-hidden border border-white/10 shadow-xl">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-white/5">
                          <span className="text-xs font-mono font-medium text-white/50">{match[1]}</span>
                          <div className="flex items-center gap-1">
                            {showExpand && (
                              <button
                                title="Expand to fullscreen"
                                aria-label="Expand to fullscreen"
                                onClick={() => setArtifactState({ isOpen: true, type: 'code', content: codeStr, language: match[1] })}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-all flex items-center gap-1.5"
                              >
                                <span className="text-[10px] font-medium">Expand</span>
                              </button>
                            )}
                            <button
                              title="Copy code"
                              aria-label="Copy code"
                              onClick={() => handleCopyCode(codeStr)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-all flex items-center gap-1.5"
                            >
                              {copiedCode === codeStr ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span className="text-[10px] font-medium">{copiedCode === codeStr ? 'Copied!' : 'Copy code'}</span>
                            </button>
                          </div>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: '1rem', background: '#111113', fontSize: '13px' }}
                          {...props}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={`px-1.5 py-0.5 rounded-md font-mono text-[13px] ${isDark ? 'bg-white/10 text-emerald-300' : 'bg-black/5 text-emerald-600'}`} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {content}
              </MemoizedMarkdown>
            </div>

            {/* AI Message Actions */}
            <div className="flex items-center gap-1 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ActionButton icon={<Copy size={14} />} label="Copy" onClick={() => navigator.clipboard.writeText(msg.content)} isDark={isDark} />
              <ActionButton icon={<RotateCcw size={14} />} label="Retry" onClick={() => {}} isDark={isDark} />
              <div className={`w-px h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
              <ActionButton icon={<ThumbsUp size={14} />} label="Helpful" onClick={() => {}} isDark={isDark} />
              <ActionButton icon={<ThumbsDown size={14} />} label="Unhelpful" onClick={() => {}} isDark={isDark} />
              <div className={`w-px h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
              <ActionButton icon={<Volume2 size={14} />} label="Read Aloud" onClick={() => {}} isDark={isDark} />
              <ActionButton icon={<Share2 size={14} />} label="Share" onClick={() => {}} isDark={isDark} />
            </div>
          </div>
        ) : (
          <div className="relative group/user-msg w-full">
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            
            {onEdit && (
              <div className="absolute -left-10 top-0 opacity-0 group-hover/user-msg:opacity-100 transition-opacity">
                <button
                  title="Edit prompt"
                  onClick={() => onEdit(msg.content)}
                  className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                    isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/5'
                  }`}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ArtifactModal 
        isOpen={artifactState.isOpen}
        onClose={() => setArtifactState(prev => ({ ...prev, isOpen: false }))}
        type={artifactState.type}
        content={artifactState.content}
        language={artifactState.language}
        isDark={isDark}
      />
    </motion.div>
  );
});

function ActionButton({ icon, label, onClick, isDark }: { icon: React.ReactNode, label: string, onClick: () => void, isDark: boolean }) {
  return (
    <button 
      title={label}
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/5'}`}
    >
      {icon}
    </button>
  );
}
