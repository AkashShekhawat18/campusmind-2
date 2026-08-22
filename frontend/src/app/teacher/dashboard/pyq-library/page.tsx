"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Search, BookOpen, Download, Folder, FileText, Upload, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherPYQLibrary() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [papers, setPapers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    collegeName: "BITS Pilani",
    subjectName: "",
    year: new Date().getFullYear().toString(),
    semester: "",
    examType: "End Sem"
  });

  useEffect(() => {
    setMounted(true);
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const token = localStorage.getItem("teacherToken");
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

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm("Are you sure you want to delete this paper? All associated questions will be deleted as well.")) return;
    
    try {
      const token = localStorage.getItem("teacherToken");
      const res = await fetch(`http://localhost:5000/api/pyq/library/${paperId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchLibrary(); // Refresh the list
      } else {
        alert("Failed to delete paper");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting paper");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setFormData({ ...formData, title: file.name.split('.')[0] });
      setShowUploadModal(true);
    }
    // reset input
    e.target.value = '';
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !formData.subjectName) {
      alert("Please select a file and enter a subject name.");
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("title", formData.title);
      fd.append("collegeName", formData.collegeName);
      fd.append("subjectName", formData.subjectName);
      fd.append("year", formData.year);
      fd.append("semester", formData.semester);
      fd.append("examType", formData.examType);

      const token = localStorage.getItem("teacherToken");
      const res = await fetch(`http://localhost:5000/api/pyq/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: fd
      });

      if (res.ok) {
        alert("Paper uploaded successfully!");
        fetchLibrary();
        setShowUploadModal(false);
        setUploadFile(null);
      } else {
        alert("Failed to upload paper.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading paper.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-600">
            PYQ Library Manager
          </h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Manage the global database of Previous Year Questions
          </p>
        </div>
        <div>
          <input 
            type="file" 
            id="pyq-upload" 
            className="hidden" 
            accept=".pdf,.jpg,.png,.webp"
            onChange={handleFileSelect} 
          />
          <button 
            onClick={() => document.getElementById('pyq-upload')?.click()}
            disabled={isUploading}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${isUploading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Upload size={16} /> Upload New Paper
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${isDark ? 'bg-[#1a1b1e] border border-white/10' : 'bg-white border border-black/10'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Paper Details</h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Title</label>
                  <input required type="text" className={`w-full px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70 mb-1">Subject Name</label>
                  <input required type="text" className={`w-full px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} value={formData.subjectName} onChange={e => setFormData({...formData, subjectName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium opacity-70 mb-1">Year</label>
                    <input type="number" className={`w-full px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium opacity-70 mb-1">Semester</label>
                    <input type="number" className={`w-full px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium opacity-70 mb-1">College</label>
                    <input type="text" className={`w-full px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} value={formData.collegeName} onChange={e => setFormData({...formData, collegeName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium opacity-70 mb-1">Exam Type</label>
                    <select className={`w-full px-4 py-2 rounded-lg border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/10'}`} value={formData.examType} onChange={e => setFormData({...formData, examType: e.target.value})}>
                      <option value="End Sem">End Sem</option>
                      <option value="Mid Sem">Mid Sem</option>
                      <option value="Quiz">Quiz</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowUploadModal(false)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}>Cancel</button>
                  <button type="submit" disabled={isUploading} className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${isUploading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isUploading ? 'Uploading & Analyzing...' : 'Upload & Analyze'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                {paper.year} {paper.semester ? `• Sem ${paper.semester}` : ''}
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
              <div className="flex gap-2">
                <button className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`} onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePaper(paper.id);
                }}>
                  <Trash2 size={16} />
                </button>
                <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`} onClick={(e) => {
                  e.stopPropagation();
                  window.open(`http://localhost:5000/api/pyq/preview/${paper.id}`, '_blank');
                }}>
                  <BookOpen size={16} /> View
                </button>
              </div>
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
