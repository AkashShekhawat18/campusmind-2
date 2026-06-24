'use client';

import { useState } from 'react';
import { BackgroundScene } from '@/components/3d/BackgroundScene';
import { motion } from 'framer-motion';
import { Users, GraduationCap, Clock, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');

  const stats = [
    { label: 'Total Students', value: '1,248', icon: <GraduationCap className="w-5 h-5 text-neon-cyan" />, color: 'border-neon-cyan' },
    { label: 'Total Teachers', value: '142', icon: <Users className="w-5 h-5 text-electric-violet" />, color: 'border-electric-violet' },
    { label: 'Pending Approvals', value: '24', icon: <Clock className="w-5 h-5 text-soft-gold" />, color: 'border-soft-gold' },
    { label: 'Active Users', value: '892', icon: <Activity className="w-5 h-5 text-green-400" />, color: 'border-green-400' }
  ];

  const pendingStudents = [
    { id: 1, name: 'Alex Johnson', roll: 'CS2026-042', course: 'Computer Science', date: '2 mins ago' },
    { id: 2, name: 'Sarah Williams', roll: 'EE2026-015', course: 'Electrical Eng.', date: '1 hour ago' },
    { id: 3, name: 'Michael Chen', roll: 'ME2026-088', course: 'Mechanical Eng.', date: '3 hours ago' }
  ];

  const pendingTeachers = [
    { id: 1, name: 'Dr. Emily Carter', empId: 'FAC-2026-012', dept: 'Physics', date: '5 hours ago' },
    { id: 2, name: 'Prof. Robert Davis', empId: 'FAC-2026-018', dept: 'Mathematics', date: '1 day ago' }
  ];

  const activityFeed = [
    { id: 1, action: 'Approved Student', user: 'Alex Johnson', time: 'Just now' },
    { id: 2, action: 'New Registration', user: 'Sarah Williams', time: '1 hour ago' },
    { id: 3, action: 'System Backup', user: 'System', time: '2 hours ago' },
    { id: 4, action: 'Rejected Teacher', user: 'Unknown User', time: '5 hours ago' }
  ];

  return (
    <div className="min-h-screen relative flex flex-col p-6 pt-20">
      <BackgroundScene />
      
      {/* Top Navbar specifically for Dashboard */}
      <nav className="fixed top-0 left-0 w-full glass-panel z-40 px-6 py-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-soft-gold/20 flex items-center justify-center">
            <div className="w-4 h-4 bg-soft-gold rounded-sm" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Campus<span className="text-soft-gold">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">Welcome, Super Admin</span>
          <div className="w-10 h-10 rounded-full bg-deep-space border border-white/20 flex items-center justify-center">
            <span className="text-xs font-bold text-white">SA</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Column - Stats and Approvals */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`glass-panel p-6 rounded-2xl border-l-4 ${stat.color}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
                  <div className="p-2 rounded-lg bg-white/5">{stat.icon}</div>
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {/* User Approval Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel rounded-2xl overflow-hidden glow-border">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white">User Approvals</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-neon-cyan text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Students
                </button>
                <button 
                  onClick={() => setActiveTab('teachers')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'teachers' ? 'bg-electric-violet text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Teachers
                </button>
              </div>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">{activeTab === 'students' ? 'Roll No.' : 'Emp ID'}</th>
                    <th className="px-6 py-4">{activeTab === 'students' ? 'Course' : 'Dept'}</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(activeTab === 'students' ? pendingStudents : pendingTeachers).map((user, i) => (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        {user.name}
                        <div className="text-xs text-gray-500 font-normal">{user.date}</div>
                      </td>
                      <td className="px-6 py-4">{activeTab === 'students' ? (user as typeof pendingStudents[0]).roll : (user as typeof pendingTeachers[0]).empId}</td>
                      <td className="px-6 py-4">{activeTab === 'students' ? (user as typeof pendingStudents[0]).course : (user as typeof pendingTeachers[0]).dept}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                  {(activeTab === 'students' ? pendingStudents : pendingTeachers).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No pending approvals.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass-panel rounded-2xl glow-border h-full max-h-[800px] flex flex-col">
            <div className="p-6 border-b border-white/10 bg-white/5">
              <h3 className="text-xl font-bold text-white">Activity Feed</h3>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="relative border-l border-white/10 ml-3 space-y-8">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-soft-gold border-[3px] border-deep-space"></div>
                    <div className="text-sm font-semibold text-white">{activity.action}</div>
                    <div className="text-sm text-gray-400">{activity.user}</div>
                    <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
