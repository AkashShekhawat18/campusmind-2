'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<{ [key: string]: string }>({
    'ALLOW_REGISTRATIONS': 'true',
    'MAINTENANCE_MODE': 'false'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err: any) {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch('http://localhost:5000/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, value })
      });
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSuccess('Settings updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-gray-400">Configure global application parameters and maintenance controls.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-xl flex items-center gap-2">
          <Save size={20} />
          {success}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6"
      >
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <h3 className="text-lg font-medium text-white">Allow New Registrations</h3>
            <p className="text-sm text-gray-400 mt-1">Enable or disable new student and teacher signups.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings['ALLOW_REGISTRATIONS'] === 'true'}
              onChange={(e) => handleUpdate('ALLOW_REGISTRATIONS', e.target.checked ? 'true' : 'false')}
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <h3 className="text-lg font-medium text-red-400">Maintenance Mode</h3>
            <p className="text-sm text-gray-400 mt-1">Lock down the system. Only administrators can log in.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings['MAINTENANCE_MODE'] === 'true'}
              onChange={(e) => handleUpdate('MAINTENANCE_MODE', e.target.checked ? 'true' : 'false')}
              disabled={saving}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>
      </motion.div>
    </div>
  );
}
