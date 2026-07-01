'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

interface Department { id: string; name: string; collegeId: string; }
interface Program { id: string; name: string; departmentId: string; }
interface Branch { id: string; name: string; departmentId: string; }
interface College { id: string; name: string; }

export default function ProgramsPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  const [newProgramName, setNewProgramName] = useState('');
  const [newBranchName, setNewBranchName] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/erp/colleges', { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }})
      .then(res => res.json()).then(setColleges).catch(console.error);
  }, []);

  useEffect(() => {
    setSelectedDepartmentId('');
    if (selectedCollegeId) {
      fetch(`http://localhost:5000/api/admin/erp/departments?collegeId=${selectedCollegeId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }})
        .then(res => res.json()).then(setDepartments).catch(console.error);
    } else {
      setDepartments([]);
    }
  }, [selectedCollegeId]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchPrograms();
      fetchBranches();
    } else {
      setPrograms([]);
      setBranches([]);
    }
  }, [selectedDepartmentId]);

  const fetchPrograms = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/erp/programs?departmentId=${selectedDepartmentId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }});
    if(res.ok) setPrograms(await res.json());
  };

  const fetchBranches = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/erp/branches?departmentId=${selectedDepartmentId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }});
    if(res.ok) setBranches(await res.json());
  };

  const addEntity = async (e: React.FormEvent, endpoint: string, name: string, setName: (v: string) => void, refresh: () => void) => {
    e.preventDefault();
    if (!selectedDepartmentId) return;
    const res = await fetch(`http://localhost:5000/api/admin/erp/${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, departmentId: selectedDepartmentId })
    });
    if (res.ok) { setName(''); refresh(); }
    else alert('Failed to add ' + endpoint);
  };

  const deleteEntity = async (endpoint: string, id: string, refresh: () => void) => {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`http://localhost:5000/api/admin/erp/${endpoint}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('adminToken') : ''}` }
    });
    if (res.ok) { refresh(); }
    else {
      const data = await res.json();
      if (data.requiresConfirmation && confirm(data.message + ' Force delete?')) {
        await fetch(`http://localhost:5000/api/admin/erp/${endpoint}/${id}?confirmCascade=true`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('adminToken') : ''}` }});
        refresh();
      } else if (!data.requiresConfirmation) alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2"><GraduationCap /> Programs & Branches</h1>
        <p className="text-gray-400">Map Programs (e.g. B.Tech) and Branches (e.g. AIML) to Departments.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4">
        <select 
          value={selectedCollegeId} 
          onChange={e => setSelectedCollegeId(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
        >
          <option value="">-- Select College --</option>
          {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          value={selectedDepartmentId} 
          onChange={e => setSelectedDepartmentId(e.target.value)}
          disabled={!selectedCollegeId}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none disabled:opacity-50"
        >
          <option value="">-- Select Department --</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {selectedDepartmentId && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Programs */}
          <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-white mb-4">Programs</h2>
            <form onSubmit={e => addEntity(e, 'programs', newProgramName, setNewProgramName, fetchPrograms)} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Program (e.g. B.Tech)" 
                value={newProgramName} 
                onChange={e => setNewProgramName(e.target.value)} 
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                required 
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"><Plus size={20} /></button>
            </form>
            <div className="space-y-2">
              {programs.map(p => (
                <div key={p.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex justify-between items-center">
                  <span className="text-white">{p.name}</span>
                  <button onClick={() => deleteEntity('programs', p.id, fetchPrograms)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} /></button>
                </div>
              ))}
              {programs.length === 0 && <div className="text-gray-500 text-sm italic">No programs mapped.</div>}
            </div>
          </motion.div>

          {/* Branches */}
          <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-xl font-semibold text-white mb-4">Branches</h2>
            <form onSubmit={e => addEntity(e, 'branches', newBranchName, setNewBranchName, fetchBranches)} className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Branch (e.g. Artificial Intelligence)" 
                value={newBranchName} 
                onChange={e => setNewBranchName(e.target.value)} 
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                required 
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"><Plus size={20} /></button>
            </form>
            <div className="space-y-2">
              {branches.map(b => (
                <div key={b.id} className="p-3 rounded-xl border border-white/10 bg-black/20 flex justify-between items-center">
                  <span className="text-white">{b.name}</span>
                  <button onClick={() => deleteEntity('branches', b.id, fetchBranches)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} /></button>
                </div>
              ))}
              {branches.length === 0 && <div className="text-gray-500 text-sm italic">No branches mapped.</div>}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
