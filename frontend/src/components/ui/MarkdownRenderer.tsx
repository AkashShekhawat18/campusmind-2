'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCheck, Copy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatMathForMarkdown } from '@/utils/markdownUtils';

interface MarkdownRendererProps {
  content: string;
  messageId?: string; // Optional: used for unique copy states
}

export function MarkdownRenderer({ content, messageId = 'default' }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="math-renderer-container overflow-x-auto">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { strict: false, trust: true }]]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');
            const copyKey = `${messageId}-${match ? match[1] : 'code'}-${codeStr.substring(0, 10)}`;

            return match ? (
              <div className="relative group/code my-3">
                <button
                  onClick={() => handleCopy(codeStr, copyKey)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 opacity-0 group-hover/code:opacity-100 transition-opacity z-10"
                >
                  {copiedId === copyKey ? (
                    <CheckCheck size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} className="text-white" />
                  )}
                </button>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-xl !bg-[#1a1a1c] !text-sm overflow-x-auto"
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className={`px-1.5 py-0.5 rounded-md text-sm ${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {formatMathForMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
