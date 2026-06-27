'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useDropzone } from 'react-dropzone';
import {
  BookOpen, ExternalLink, Upload, File, FileText, Image as ImageIcon,
  Download, Trash2, Search, Filter, Loader2, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

type Resource = {
  id: string;
  title: string;
  description: string;
  fileType: string;
  filePath: string;
  department: string;
  semester: number;
  subjectName: string;
  uploadedById: string;
  createdAt: string;
  uploadedBy: { name: string };
  isBookmarked?: boolean;
};

export default function ResourcesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  
  const [activeTab, setActiveTab] = useState<'bits' | 'campusmind'>('bits');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter State
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('studentToken') : null;

  useEffect(() => {
    setMounted(true);
    if (activeTab === 'campusmind') fetchResources();
  }, [activeTab]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (filterDept) query.append('department', filterDept);
      if (filterSem) query.append('semester', filterSem);

      const res = await fetch(`http://localhost:5000/api/student/resources?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setResources(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleBookmark = async (id: string, isBookmarked: boolean) => {
    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const res = await fetch(`http://localhost:5000/api/student/resources/${id}/bookmark`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchResources();
    } catch (err) { console.error(err); }
  };

  const handleDownload = async (id: string, filePath: string) => {
    try {
      await fetch(`http://localhost:5000/api/student/resources/${id}/download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      window.open(`http://localhost:5000/${filePath}`, '_blank');
    } catch (err) { console.error(err); }
  };

  const getFileIcon = (type: string) => {
    if (type === 'PDF') return <FileText className="text-red-400" />;
    if (type === 'DOCX') return <FileText className="text-blue-400" />;
    if (type === 'IMAGE') return <ImageIcon className="text-green-400" />;
    return <File className="text-gray-400" />;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Study Resources</h1>
        <p className={`text-sm mb-6 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Access official BITS Pilani library or share notes with students.
        </p>

        {/* Tabs */}
        <div className={`inline-flex p-1 rounded-xl mb-8 ${isDark ? 'bg-[#111113] border border-white/5' : 'bg-[#e8e8ed] border border-black/5'}`}>
          <button
            onClick={() => setActiveTab('bits')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'bits'
                ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                : (isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black')
            }`}
          >
            BITS Pilani Library
          </button>
          <button
            onClick={() => setActiveTab('campusmind')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'campusmind'
                ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-black shadow-sm')
                : (isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black')
            }`}
          >
            CampusMind Resources
          </button>
        </div>
      </motion.div>

      {/* BITS Library Tab */}
      {activeTab === 'bits' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`max-w-2xl rounded-2xl p-8 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20">
            <BookOpen size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Official BITS Pilani E-Library</h2>
          <p className={`mb-8 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            Access thousands of research papers, e-books, journals, and official academic resources provided by BITS Pilani.
            You will be redirected to the official portal where your BITS credentials are required.
          </p>
          <a
            href="https://www.bits-pilani.ac.in/library/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
          >
            Open Official Library <ExternalLink size={18} />
          </a>
        </motion.div>
      )}

      {/* CampusMind Resources Tab */}
      {activeTab === 'campusmind' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Resources Grid */}
          <div className="lg:col-span-4">
            {/* Filters */}
            <div className={`mb-6 p-4 rounded-xl border flex flex-wrap items-center gap-4 ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
              <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                <Search size={16} className="opacity-40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchResources()}
                  placeholder="Search resources..."
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="opacity-40" />
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={`px-3 py-2 rounded-lg text-sm border outline-none ${isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-black/10'}`}>
                  <option value="">All Depts</option>
                  <option value="Computer Science">CS</option>
                  <option value="Electronics">ECE</option>
                </select>
                <select value={filterSem} onChange={(e) => setFilterSem(e.target.value)} className={`px-3 py-2 rounded-lg text-sm border outline-none ${isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-black/10'}`}>
                  <option value="">All Sems</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
                <button onClick={fetchResources} className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}>
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-400" size={32} /></div>
            ) : resources.length === 0 ? (
              <div className={`text-center py-16 rounded-2xl border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold mb-2 opacity-60">No resources found</h3>
                <p className={`text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>Adjust your filters or upload a new resource.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <motion.div key={resource.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`relative group rounded-xl p-5 border transition-all ${isDark ? 'bg-[#111113] border-white/5 hover:border-white/20' : 'bg-white border-black/5 hover:border-black/20'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        {getFileIcon(resource.fileType)}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownload(resource.id, resource.filePath)}
                          className={`p-1.5 rounded-md ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => toggleBookmark(resource.id, resource.isBookmarked || false)}
                          className={`p-1.5 rounded-md ${resource.isBookmarked ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : (isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20')}`}
                        >
                          <Bookmark size={14} className={resource.isBookmarked ? 'fill-current' : ''} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm truncate mb-1">{resource.title}</h4>
                    <p className={`text-xs truncate mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {resource.subjectName} • Sem {resource.semester}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-current border-opacity-10">
                      <div className={`text-[10px] font-medium px-2 py-1 rounded-md ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        {resource.fileType}
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        By {resource.uploadedBy.name}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
