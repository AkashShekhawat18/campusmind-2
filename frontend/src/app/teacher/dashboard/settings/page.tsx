'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Settings, User, Bell, Shield, Moon, Sun, Monitor, Save } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  useEffect(() => {
    setMounted(true);
    setTeacherName(localStorage.getItem('teacherName') || 'Demo Teacher');
    setTeacherEmail(localStorage.getItem('teacherEmail') || 'teacher@campusmind.ai');
  }, []);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for actual API call
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    alert("Password change functionality will be implemented in the next version.");
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Manage your account preferences, appearance, and security.
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 md:p-8 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
      >
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <User size={20} className="text-blue-400" /> Profile Information
        </h2>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex flex-col items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
            <span className="text-3xl font-bold">{teacherName.charAt(0)}</span>
            <span className="text-[10px] mt-1 opacity-70">TEACHER</span>
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Full Name</label>
                <input
                  type="text"
                  value={teacherName}
                  disabled
                  className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white/50 cursor-not-allowed' : 'bg-black/5 border-black/10 text-black/50 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Email Address</label>
                <input
                  type="email"
                  value={teacherEmail}
                  disabled
                  className={`w-full px-4 py-2.5 rounded-lg text-sm border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white/50 cursor-not-allowed' : 'bg-black/5 border-black/10 text-black/50 cursor-not-allowed'}`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Role</label>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                <Shield size={14} /> Official Faculty Account
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Appearance Section */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`rounded-2xl p-6 md:p-8 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
      >
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Moon size={20} className="text-purple-400" /> Appearance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
              theme === 'light'
                ? (isDark ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500 bg-purple-50')
                : (isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')
            }`}
          >
            <Sun size={24} className={`mb-2 ${theme === 'light' ? 'text-purple-500' : 'opacity-50'}`} />
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-purple-500' : ''}`}>Light Theme</span>
          </button>
          
          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
              theme === 'dark'
                ? (isDark ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500 bg-purple-50')
                : (isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')
            }`}
          >
            <Moon size={24} className={`mb-2 ${theme === 'dark' ? 'text-purple-500' : 'opacity-50'}`} />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-500' : ''}`}>Dark Theme</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
              theme === 'system'
                ? (isDark ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500 bg-purple-50')
                : (isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')
            }`}
          >
            <Monitor size={24} className={`mb-2 ${theme === 'system' ? 'text-purple-500' : 'opacity-50'}`} />
            <span className={`text-sm font-medium ${theme === 'system' ? 'text-purple-500' : ''}`}>System Default</span>
          </button>
        </div>
      </motion.section>

      {/* Security Section */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className={`rounded-2xl p-6 md:p-8 border ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}
      >
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Shield size={20} className="text-green-400" /> Security
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg text-sm border outline-none focus:border-green-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg text-sm border outline-none focus:border-green-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg text-sm border outline-none focus:border-green-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}
            />
          </div>
          <button
            type="submit"
            className={`mt-4 flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <Save size={16} /> Update Password
          </button>
        </form>
      </motion.section>
    </div>
  );
}
