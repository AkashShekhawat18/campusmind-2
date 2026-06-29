'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bell, Users, Megaphone, Clock } from 'lucide-react';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [target, setTarget] = useState('ALL');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch('http://localhost:5000/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true);

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch('http://localhost:5000/api/admin/notifications', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, message, type, target })
      });
      
      if (response.ok) {
        const newNotif = await response.json();
        setNotifications([newNotif, ...notifications]);
        setTitle('');
        setMessage('');
        alert('Notification dispatched successfully!');
      } else {
        alert('Failed to send notification');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Notification Center</h1>
        <p className="text-gray-400">Broadcast messages and alerts to users across the platform.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Notification Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 h-max"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Send size={20} className="text-blue-400" /> New Broadcast
          </h2>
          
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. System Maintenance"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Details of the announcement..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="ALERT">Alert</option>
                  <option value="REMINDER">Reminder</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target</label>
                <select 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="ALL">All Users</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="TEACHERS">Teachers Only</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={sending}
              className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? 'Dispatching...' : <><Megaphone size={18} /> Broadcast Now</>}
            </button>
          </form>
        </motion.div>

        {/* History List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Bell size={20} className="text-amber-400" /> Dispatch History
          </h2>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading history...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-black/20 rounded-xl border border-white/5">
                No notifications have been dispatched yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 mt-1 ${
                    notif.type === 'ALERT' ? 'bg-red-500/20 text-red-400' :
                    notif.type === 'REMINDER' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {notif.type === 'ALERT' ? <Bell size={20} /> : <Megaphone size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">{notif.title}</h4>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{notif.message}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-gray-400 text-xs font-medium">
                      <Users size={12} /> Target: {notif.target}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
