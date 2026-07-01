'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Trash2, Layers, BookOpen } from 'lucide-react';

interface Entity { id: string; name: string; }
interface AcademicYear { id: string; year: string; isCurrent: boolean; }
interface Semester { id: string; number: number; programId: string; }
interface Section { id: string; name: string; }
interface Subject { id: string; name: string; code: string; credits: number; branchId: string; }

export default function AcademicsPage() {
  const [colleges, setColleges] = useState<Entity[]>([]);
  const [departments, setDepartments] = useState<Entity[]>([]);
  const [programs, setPrograms] = useState<Entity[]>([]);
  const [branches, setBranches] = useState<Entity[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [newYear, setNewYear] = useState('');
  const [newSemNum, setNewSemNum] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCredits, setNewSubCredits] = useState('');

  const authHeader = { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('adminToken') : ''}` };

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/erp/colleges', { headers: authHeader }).then(r => r.json()).then(setColleges);
    fetch('http://localhost:5000/api/admin/erp/academicyears', { headers: authHeader }).then(r => r.json()).then(setAcademicYears);
  }, []);

  useEffect(() => {
    setSelectedDepartmentId('');
    if (selectedCollegeId) fetch(`http://localhost:5000/api/admin/erp/departments?collegeId=${selectedCollegeId}`, { headers: authHeader }).then(r => r.json()).then(setDepartments);
    else setDepartments([]);
  }, [selectedCollegeId]);

  useEffect(() => {
    setSelectedProgramId(''); setSelectedBranchId('');
    if (selectedDepartmentId) {
      fetch(`http://localhost:5000/api/admin/erp/programs?departmentId=${selectedDepartmentId}`, { headers: authHeader }).then(r => r.json()).then(setPrograms);
      fetch(`http://localhost:5000/api/admin/erp/branches?departmentId=${selectedDepartmentId}`, { headers: authHeader }).then(r => r.json()).then(setBranches);
    } else {
      setPrograms([]); setBranches([]);
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    setSelectedSemesterId('');
    if (selectedProgramId && selectedYearId) fetchSemesters();
    else setSemesters([]);
  }, [selectedProgramId, selectedYearId]);

  useEffect(() => {
    if (selectedSemesterId) {
      fetchSections();
      if (selectedBranchId) fetchSubjects();
    } else {
      setSections([]); setSubjects([]);
    }
  }, [selectedSemesterId, selectedBranchId]);

  const fetchSemesters = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/erp/semesters?programId=${selectedProgramId}&academicYearId=${selectedYearId}`, { headers: authHeader });
    if(res.ok) setSemesters(await res.json());
  };
  const fetchSections = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/erp/sections?semesterId=${selectedSemesterId}`, { headers: authHeader });
    if(res.ok) setSections(await res.json());
  };
  const fetchSubjects = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/erp/subjects?semesterId=${selectedSemesterId}&branchId=${selectedBranchId}`, { headers: authHeader });
    if(res.ok) setSubjects(await res.json());
  };

  const addYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/admin/erp/academicyears', {
      method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: newYear })
    });
    if (res.ok) { setNewYear(''); fetch('http://localhost:5000/api/admin/erp/academicyears', { headers: authHeader }).then(r => r.json()).then(setAcademicYears); }
    else alert('Failed to add year');
  };

  const addSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId || !selectedYearId) return;
    const res = await fetch('http://localhost:5000/api/admin/erp/semesters', {
      method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: newSemNum, programId: selectedProgramId, academicYearId: selectedYearId })
    });
    if (res.ok) { setNewSemNum(''); fetchSemesters(); }
    else alert('Failed to add semester');
  };

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSemesterId) return;
    const res = await fetch('http://localhost:5000/api/admin/erp/sections', {
      method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSectionName, semesterId: selectedSemesterId })
    });
    if (res.ok) { setNewSectionName(''); fetchSections(); }
    else alert('Failed to add section');
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSemesterId || !selectedBranchId) return alert('Select Branch and Semester first');
    const res = await fetch('http://localhost:5000/api/admin/erp/subjects', {
      method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubName, code: newSubCode, credits: newSubCredits, semesterId: selectedSemesterId, branchId: selectedBranchId })
    });
    if (res.ok) { setNewSubName(''); setNewSubCode(''); setNewSubCredits(''); fetchSubjects(); }
    else alert('Failed to add subject');
  };

  const del = async (endpoint: string, id: string, refresh: () => void) => {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`http://localhost:5000/api/admin/erp/${endpoint}/${id}`, { method: 'DELETE', headers: authHeader });
    if (res.ok) refresh();
    else {
      const data = await res.json();
      if (data.requiresConfirmation && confirm(data.message + ' Force delete?')) {
        await fetch(`http://localhost:5000/api/admin/erp/${endpoint}/${id}?confirmCascade=true`, { method: 'DELETE', headers: authHeader });
        refresh();
      } else if (!data.requiresConfirmation) alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2"><CalendarDays /> Academics (Semesters & Sections)</h1>
        <p className="text-gray-400">Manage Years, Semesters, Sections, and Subjects mappings.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <select value={selectedCollegeId} onChange={e => setSelectedCollegeId(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none">
            <option value="">-- College --</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)} disabled={!selectedCollegeId} className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none disabled:opacity-50">
            <option value="">-- Department --</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)} disabled={!selectedDepartmentId} className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none disabled:opacity-50">
            <option value="">-- Program --</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} disabled={!selectedDepartmentId} className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none disabled:opacity-50">
            <option value="">-- Branch --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className="flex gap-4 items-center border-t border-white/10 pt-4">
          <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none w-64">
            <option value="">-- Academic Year --</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.year}</option>)}
          </select>
          <span className="text-gray-500">OR</span>
          <form onSubmit={addYear} className="flex gap-2">
            <input type="text" placeholder="New Year (e.g. 2026-2027)" value={newYear} onChange={e => setNewYear(e.target.value)} className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none" required />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"><Plus size={20} /></button>
          </form>
        </div>
      </div>

      {selectedProgramId && selectedYearId && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Semesters */}
          <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-white mb-4">Semesters</h2>
            <form onSubmit={addSemester} className="flex gap-2 mb-4">
              <input type="number" min="1" max="10" placeholder="Sem Number (e.g. 1)" value={newSemNum} onChange={e => setNewSemNum(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" required />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"><Plus size={20} /></button>
            </form>
            <div className="space-y-2">
              {semesters.map(s => (
                <div key={s.id} onClick={() => setSelectedSemesterId(s.id)} className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center ${selectedSemesterId === s.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-black/20 border-white/10 hover:bg-white/10'}`}>
                  <span className="text-white font-medium">Semester {s.number}</span>
                  <button onClick={(e) => { e.stopPropagation(); del('semesters', s.id, fetchSemesters); }} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                </div>
              ))}
              {semesters.length === 0 && <div className="text-gray-500 text-sm italic">No semesters mapped.</div>}
            </div>
          </motion.div>

          {/* Sections & Subjects require a selected Semester */}
          <div className="md:col-span-2 space-y-6">
            {!selectedSemesterId ? (
               <div className="h-full min-h-[200px] border border-white/5 border-dashed rounded-2xl flex items-center justify-center text-gray-500">
                 Select a semester to manage sections and subjects.
               </div>
            ) : (
              <>
                <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Layers size={20}/> Sections</h2>
                  <form onSubmit={addSection} className="flex gap-2 mb-4">
                    <input type="text" placeholder="Section Name (e.g. A, B)" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} className="w-64 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none" required />
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg"><Plus size={20} /></button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {sections.map(sec => (
                      <div key={sec.id} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 text-white">
                        {sec.name}
                        <button onClick={() => del('sections', sec.id, fetchSections)} className="text-red-400 hover:text-red-300 ml-2"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {sections.length === 0 && <div className="text-gray-500 text-sm italic">No sections created.</div>}
                  </div>
                </motion.div>

                <motion.div className="bg-white/5 border border-white/10 rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><BookOpen size={20}/> Subjects {selectedBranchId ? '' : '(Select Branch to view)'}</h2>
                  {selectedBranchId ? (
                    <>
                      <form onSubmit={addSubject} className="flex gap-2 mb-4">
                        <input type="text" placeholder="Subject Name" value={newSubName} onChange={e => setNewSubName(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none" required />
                        <input type="text" placeholder="Code (e.g. CS101)" value={newSubCode} onChange={e => setNewSubCode(e.target.value)} className="w-32 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none" required />
                        <input type="number" placeholder="Credits" value={newSubCredits} onChange={e => setNewSubCredits(e.target.value)} className="w-24 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none" required />
                        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg"><Plus size={20} /></button>
                      </form>
                      <div className="space-y-2">
                        {subjects.map(sub => (
                          <div key={sub.id} className="bg-black/20 border border-white/10 rounded-xl p-3 flex justify-between items-center text-white">
                            <div>
                              <div className="font-medium">{sub.name} <span className="text-amber-400 text-sm ml-2">[{sub.code}]</span></div>
                              <div className="text-xs text-gray-400">Credits: {sub.credits}</div>
                            </div>
                            <button onClick={() => del('subjects', sub.id, fetchSubjects)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        ))}
                        {subjects.length === 0 && <div className="text-gray-500 text-sm italic">No subjects added.</div>}
                      </div>
                    </>
                  ) : (
                    <div className="text-amber-500/70 text-sm">Please select a Branch from the top filters to manage subjects.</div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
