'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Trash2 } from 'lucide-react';

interface College { id: string; name: string; location: string | null; }
interface Department { id: string; name: string; collegeId: string; }

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Forms
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeLocation, setNewCollegeLocation] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  const fetchColleges = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/erp/colleges', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) setColleges(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchDepartments = async (collegeId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/erp/departments?collegeId=${collegeId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) setDepartments(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchColleges().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCollegeId) fetchDepartments(selectedCollegeId);
    else setDepartments([]);
  }, [selectedCollegeId]);

  const addCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/erp/colleges', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollegeName, location: newCollegeLocation })
      });
      if (res.ok) {
        setNewCollegeName('');
        setNewCollegeLocation('');
        fetchColleges();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add college');
      }
    } catch (e) { console.error(e); }
  };

  const deleteCollege = async (id: string) => {
    if (!confirm('Delete this college?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/erp/colleges/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        if (selectedCollegeId === id) setSelectedCollegeId('');
        fetchColleges();
      } else {
        const data = await res.json();
        if (data.requiresConfirmation) {
          if (confirm(data.message + ' Force delete?')) {
            await fetch(`http://localhost:5000/api/admin/erp/colleges/${id}?confirmCascade=true`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }});
            if (selectedCollegeId === id) setSelectedCollegeId('');
            fetchColleges();
          }
        } else {
          alert(data.error || 'Failed to delete');
        }
      }
    } catch (e) { console.error(e); }
  };

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollegeId) return alert('Select a college first');
    try {
      const res = await fetch('http://localhost:5000/api/admin/erp/departments', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName, collegeId: selectedCollegeId })
      });
      if (res.ok) {
        setNewDeptName('');
        fetchDepartments(selectedCollegeId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add department');
      }
    } catch (e) { console.error(e); }
  };

  const deleteDepartment = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/erp/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        fetchDepartments(selectedCollegeId);
      } else {
        const data = await res.json();
        if (data.requiresConfirmation) {
          if (confirm(data.message + ' Force delete?')) {
            await fetch(`http://localhost:5000/api/admin/erp/departments/${id}?confirmCascade=true`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }});
            fetchDepartments(selectedCollegeId);
          }
        } else {
          alert(data.error || 'Failed to delete');
        }
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2"><Building2 /> Colleges & Departments</h1>
        <p className="text-gray-400">Manage the highest level of academic structure.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Colleges */}
        <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-semibold text-white mb-4">Colleges</h2>
          <form onSubmit={addCollege} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="College Name" 
              value={newCollegeName} 
              onChange={e => setNewCollegeName(e.target.value)} 
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
              required 
            />
            <input 
              type="text" 
              placeholder="Location" 
              value={newCollegeLocation} 
              onChange={e => setNewCollegeLocation(e.target.value)} 
              className="w-1/3 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"><Plus size={20} /></button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {colleges.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedCollegeId(c.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors flex justify-between items-center ${
                  selectedCollegeId === c.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="text-white font-medium">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.location || 'No location'}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteCollege(c.id); }}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {colleges.length === 0 && <div className="text-gray-500 text-sm italic">No colleges found.</div>}
          </div>
        </motion.div>

        {/* Departments */}
        <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-semibold text-white mb-4">Departments</h2>
          
          {!selectedCollegeId ? (
            <div className="text-gray-500 text-sm italic h-[200px] flex items-center justify-center border border-white/5 border-dashed rounded-xl">
              Select a college to view departments
            </div>
          ) : (
            <>
              <form onSubmit={addDepartment} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  placeholder="Department Name (e.g. Computer Science)" 
                  value={newDeptName} 
                  onChange={e => setNewDeptName(e.target.value)} 
                  className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  required 
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"><Plus size={20} /></button>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {departments.map(d => (
                  <div key={d.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex justify-between items-center">
                    <span className="text-white">{d.name}</span>
                    <button 
                      onClick={() => deleteDepartment(d.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {departments.length === 0 && <div className="text-gray-500 text-sm italic">No departments found for this college.</div>}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
