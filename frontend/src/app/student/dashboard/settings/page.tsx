'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Settings as SettingsIcon, Bell, Moon, Monitor, Sun, Save, Loader2, Globe } from 'lucide-react';

export default function StudentSettings() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [settings, setSettings] = useState({
    theme: 'system',
    notifications: true,
    language: 'en'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('studentToken');
      const res = await fetch('http://localhost:5000/api/student/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          theme: data.theme || 'system',
          notifications: data.notifications ?? true,
          language: data.language || 'en'
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
      const res = await fetch('http://localhost:5000/api/student/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        if (settings.theme !== 'system') {
          setTheme(settings.theme);
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings.' });
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
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <SettingsIcon className="text-cyan-400" size={32} />
          Preferences
        </h1>
        <p className={`text-sm mb-8 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Customize your MALPHOR experience.
        </p>

        <div className={`rounded-2xl border p-6 md:p-8 space-y-8 ${isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'}`}>
          
          {/* Appearance */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Moon size={18} className="text-cyan-400" />
              Appearance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System Default' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSettings({ ...settings, theme: t.id })}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    settings.theme === t.id 
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-500' 
                      : (isDark ? 'border-white/5 hover:border-white/20' : 'border-black/5 hover:border-black/20')
                  }`}
                >
                  <t.icon size={24} className="mb-2" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-current opacity-10 my-4" />

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell size={18} className="text-cyan-400" />
              Notifications
            </h3>
            <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Receive alerts for new resources and messages.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          <div className="w-full h-px bg-current opacity-10 my-4" />

          {/* Language */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe size={18} className="text-cyan-400" />
              Language
            </h3>
            <div className="w-full md:w-1/2">
              <select 
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border outline-none text-sm ${isDark ? 'bg-[#111113] border-white/10' : 'bg-white border-black/10'}`}
              >
                <option value="en">English (US)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="te">Telugu (తెలుగు)</option>
              </select>
            </div>
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
              Save Preferences
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
