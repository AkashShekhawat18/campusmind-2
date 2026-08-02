"use client";

import React from 'react';
import { Search, Filter as FilterIcon, CheckCircle2, AlertTriangle, Brain } from 'lucide-react';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterType: 'ALL' | 'EXACT' | 'CONCEPT' | 'NEW';
  setFilterType: (f: 'ALL' | 'EXACT' | 'CONCEPT' | 'NEW') => void;
  isDark: boolean;
}

export function Filters({ searchTerm, setSearchTerm, filterType, setFilterType, isDark }: FiltersProps) {
  const tabs = [
    { id: 'ALL', label: 'All Questions', icon: null },
    { id: 'EXACT', label: 'Exact Match', icon: AlertTriangle, color: 'text-rose-500' },
    { id: 'CONCEPT', label: 'Concept Match', icon: Brain, color: 'text-amber-500' },
    { id: 'NEW', label: 'New / Unique', icon: CheckCircle2, color: 'text-emerald-500' }
  ];

  return (
    <div className={`sticky top-6 z-20 mb-6 p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-xl ${isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-black/10'}`}>
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
        <FilterIcon className="w-4 h-4 opacity-50 ml-2 hidden md:block" />
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              filterType === tab.id 
                ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg')
                : (isDark ? 'hover:bg-white/10 opacity-70 hover:opacity-100' : 'hover:bg-black/5 opacity-70 hover:opacity-100')
            }`}
          >
            {tab.icon && <tab.icon className={`w-4 h-4 ${filterType === tab.id ? 'text-inherit' : tab.color}`} />}
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className={`flex items-center px-4 py-2 rounded-xl border w-full md:w-64 transition-all focus-within:w-full md:focus-within:w-80 ${isDark ? 'bg-white/5 border-white/10 focus-within:border-emerald-500/50' : 'bg-black/5 border-black/10 focus-within:border-emerald-500/50'}`}>
        <Search className="w-4 h-4 opacity-50 mr-3 shrink-0" />
        <input 
          type="text" 
          placeholder="Search questions, topics..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>
    </div>
  );
}
