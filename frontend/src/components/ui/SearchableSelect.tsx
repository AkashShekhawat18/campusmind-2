'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  themeColor?: string; // e.g. "neon-cyan" or "electric-violet"
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  themeColor = "neon-cyan"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Memoize filtered options for performance
  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lowerQuery));
  }, [options, query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length === 0) {
          selectOption('Other');
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Open handler
  const handleOpen = () => {
    setIsOpen(true);
    setQuery('');
    const idx = options.indexOf(value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  };

  const selectOption = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
    setQuery('');
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  const highlightMatch = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} className={`text-${themeColor} font-semibold`}>{part}</span> : part
    );
  };

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <label className="block text-sm font-medium text-foreground/70 mb-1">{label}</label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-foreground/5 border ${isOpen ? `border-${themeColor}` : 'border-foreground/10'} rounded-lg px-4 py-2.5 text-foreground flex items-center justify-between focus:outline-none focus:border-${themeColor} transition-colors text-left`}
      >
        <span className={value ? "truncate" : "opacity-50"}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <X 
              size={14} 
              className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" 
              onClick={clearSelection} 
            />
          )}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 rounded-xl border border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-foreground/10 relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                ref={inputRef}
                autoFocus
                type="text"
                placeholder="Search..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                className="w-full bg-foreground/5 rounded-lg pl-8 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
              />
            </div>

            {/* Options List */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-60 overflow-y-auto p-1 scrollbar-thin"
            >
              {filteredOptions.length === 0 ? (
                <li
                  role="option"
                  onClick={() => selectOption('Other')}
                  onMouseEnter={() => setHighlightedIndex(-1)}
                  className="px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors hover:bg-foreground/5 text-foreground italic"
                >
                  No results found. Select "Other"
                </li>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt === value;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <li
                      key={opt}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                        isHighlighted ? `bg-${themeColor}/10 text-${themeColor}` : 'hover:bg-foreground/5'
                      } ${isSelected ? 'font-medium' : ''}`}
                    >
                      {highlightMatch(opt)}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
