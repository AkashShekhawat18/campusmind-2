"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface LatexTextProps {
  children: string;
  className?: string;
}

/**
 * Renders text that may contain inline ($...$) or display ($$...$$) LaTeX.
 * Falls back to plain text rendering if no LaTeX is present.
 */
export default function LatexText({ children, className }: LatexTextProps) {
  if (!children) return null;

  return (
    <span className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Render paragraphs as inline spans to avoid block-level nesting issues
          p: ({ children }) => <span>{children}</span>,
        }}
      >
        {children}
      </ReactMarkdown>
    </span>
  );
}
