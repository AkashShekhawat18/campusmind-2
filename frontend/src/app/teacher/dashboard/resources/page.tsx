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
};

export default function ResourcesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  
  const [activeTab, setActiveTab] = useState<'bits' | 'campusmind'>('bits');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Upload State
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', department: 'Computer Science', semester: '1', subjectName: '' });
  const [uploading, setUploading] = useState(false);
  
  // Filter State
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('teacherToken') : null;
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('teacherId') : null;

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

      const res = await fetch(`http://localhost:5000/api/teacher/resources?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setResources(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !uploadForm.title || !uploadForm.subjectName) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('department', uploadForm.department);
    formData.append('semester', uploadForm.semester);
    formData.append('subjectName', uploadForm.subjectName);

    try {
      const res = await fetch('http://localhost:5000/api/teacher/resources/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setUploadForm({ title: '', description: '', department: 'Computer Science', semester: '1', subjectName: '' });
        fetchResources();
      }
    } catch (err) { console.error(err); }
    setUploading(false);
  }, [uploadForm, token]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: !uploadForm.title || !uploadForm.subjectName
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/teacher/resources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchResources();
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
          {/* Upload Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-5 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
            >
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Upload size={16} className="text-purple-400" /> Share Resource
              </h3>
              
              <div className="space-y-3 mb-4">
                <input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title (e.g. OS Chapter 1 Notes)"
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:outline-none`}
                />
                <input
                  value={uploadForm.subjectName}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, subjectName: e.target.value }))}
                  placeholder="Subject Name"
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:outline-none`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={uploadForm.department}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, department: e.target.value }))}
                    className={`px-2 py-2 rounded-lg text-xs border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:outline-none`}
                  >
                    <option value="Computer Science">CS</option>
                    <option value="Electronics">ECE/EEE</option>
                    <option value="Mechanical">Mech</option>
                  </select>
                  <select
                    value={uploadForm.semester}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                    className={`px-2 py-2 rounded-lg text-xs border ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:outline-none`}
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className={`w-full px-3 py-2 rounded-lg text-sm border resize-none h-20 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} focus:outline-none`}
                />
              </div>

              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                (!uploadForm.title || !uploadForm.subjectName) ? 'opacity-40 cursor-not-allowed' : ''
              } ${isDragActive ? 'border-purple-500 bg-purple-500/10' : isDark ? 'border-white/10 hover:border-purple-500/50' : 'border-black/10 hover:border-purple-500/50'}`}>
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 size={24} className="mx-auto animate-spin text-purple-400" />
                ) : (
                  <>
                    <Upload size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-[10px] opacity-60">
                      {(!uploadForm.title || !uploadForm.subjectName) ? 'Fill title & subject first' : 'Drop file (PDF, PPT, DOCX, IMG)'}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Resources Grid */}
          <div className="lg:col-span-3">
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
                    className={`relative group rounded-xl p-5 border transition-all cursor-pointer ${isDark ? 'bg-[#111113] border-white/5 hover:border-white/20' : 'bg-white border-black/5 hover:border-black/20'}`}
                    onClick={() => setPreviewUrl(resource.filePath.startsWith('http') ? resource.filePath : `http://localhost:5000/${resource.filePath}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        {getFileIcon(resource.fileType)}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={resource.filePath.startsWith('http') ? resource.filePath : `http://localhost:5000/${resource.filePath}`}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`p-1.5 rounded-md ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                        >
                          <Download size={14} />
                        </a>
                        {currentUserId === resource.uploadedById && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(resource.id); }}
                            className={`p-1.5 rounded-md ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setPreviewUrl(null)}>
          <div className={`relative w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden border ${isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-black/10'}`} onClick={e => e.stopPropagation()}>
            <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 ${isDark ? 'bg-black/50 backdrop-blur-md' : 'bg-white/50 backdrop-blur-md'}`}>
              <h3 className="font-semibold text-sm">Document Preview</h3>
              <button onClick={() => setPreviewUrl(null)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                Close
              </button>
            </div>
            <iframe src={previewUrl} className="w-full h-full border-none pt-16" title="Document Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
