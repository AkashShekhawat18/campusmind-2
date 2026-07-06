"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Search, BookOpen, Download, Folder, FileText, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentPYQLibrary() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [papers, setPapers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const token = localStorage.getItem("studentToken");
      const res = await fetch(`http://localhost:5000/api/pyq/library`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPapers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            PYQ Library
          </h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Access the global database of Previous Year Questions
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-current rounded-lg opacity-80 hover:opacity-100 transition-opacity">
          <Upload size={16} /> Contribute PYQ
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
        <input 
          placeholder="Search by Subject, Year, or Exam Type..." 
          className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {papers.filter(p => (p.subjectName || "").toLowerCase().includes(search.toLowerCase())).map((paper) => (
          <motion.div 
            key={paper.id} 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-6 border transition-all cursor-pointer ${isDark ? 'bg-[#111113] border-white/5 hover:bg-white/5' : 'bg-white border-black/5 hover:bg-black/5'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                {paper.year} • {paper.semester} Semester
              </span>
              <span className={`px-2 py-1 rounded-md text-xs border ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                {paper.examType || 'End Sem'}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-1">{paper.subjectName}</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{paper.collegeName}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-current border-opacity-10">
              <div className="flex items-center gap-2 text-sm opacity-60">
                <FileText size={16} />
                <span>{paper._count?.questions || 0} Questions</span>
              </div>
              <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`} onClick={(e) => {
                e.stopPropagation();
                window.open(paper.fileUrl, '_blank');
              }}>
                <BookOpen size={16} /> View
              </button>
            </div>
          </motion.div>
        ))}
        
        {papers.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="opacity-50">No PYQs found in the library.</p>
          </div>
        )}
      </div>
    </div>
  );
}
