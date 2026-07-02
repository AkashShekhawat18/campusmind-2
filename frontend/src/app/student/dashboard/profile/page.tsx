'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { User, Mail, BookOpen, GraduationCap, Building2, Save, Loader2 } from 'lucide-react';

export default function StudentProfile() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    department: '',
    semester: '',
    course: '',
    bio: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      const res = await fetch('http://localhost:5000/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          department: data.studentProfile?.department || '',
          semester: data.studentProfile?.semester || '',
          course: data.studentProfile?.course || '',
          bio: data.studentProfile?.bio || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('studentToken');
      const res = await fetch('http://localhost:5000/api/student/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          department: profile.department,
          semester: profile.semester,
          course: profile.course,
          bio: profile.bio
        })
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" size={32} /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Student Profile</h1>
        <p className={`text-sm mb-8 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Manage your personal information and academic details.
        </p>

        <div className={`rounded-2xl border p-6 md:p-8 ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-cyan-500/20">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                Student Account
              </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 w-full space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Full Name</label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} opacity-70`}>
                    <User size={16} className={isDark ? 'text-white/40' : 'text-black/40'} />
                    <input value={profile.name} disabled className="bg-transparent border-none outline-none text-sm w-full" />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Email Address</label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'} opacity-70`}>
                    <Mail size={16} className={isDark ? 'text-white/40' : 'text-black/40'} />
                    <input value={profile.email} disabled className="bg-transparent border-none outline-none text-sm w-full" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Department</label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border focus-within:border-cyan-400/50 transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                    <Building2 size={16} className={isDark ? 'text-white/40' : 'text-black/40'} />
                    <select 
                      value={profile.department} 
                      onChange={e => setProfile({...profile, department: e.target.value})}
                      className={`bg-transparent border-none outline-none text-sm w-full ${isDark ? 'text-white' : 'text-black'}`}
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Course / Degree</label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border focus-within:border-cyan-400/50 transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                    <GraduationCap size={16} className={isDark ? 'text-white/40' : 'text-black/40'} />
                    <input 
                      value={profile.course} 
                      onChange={e => setProfile({...profile, course: e.target.value})}
                      placeholder="e.g. B.E. (Hons.)"
                      className="bg-transparent border-none outline-none text-sm w-full" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Current Semester</label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border focus-within:border-cyan-400/50 transition-colors w-full md:w-1/2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                  <BookOpen size={16} className={isDark ? 'text-white/40' : 'text-black/40'} />
                  <select 
                    value={profile.semester} 
                    onChange={e => setProfile({...profile, semester: e.target.value})}
                    className={`bg-transparent border-none outline-none text-sm w-full ${isDark ? 'text-white' : 'text-black'}`}
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Bio (Optional)</label>
                <textarea 
                  value={profile.bio} 
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell us a bit about your academic interests..."
                  className={`w-full px-3 py-2 rounded-lg text-sm border focus:border-cyan-400/50 outline-none resize-none h-24 transition-colors ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
                />
              </div>

              {message.text && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
