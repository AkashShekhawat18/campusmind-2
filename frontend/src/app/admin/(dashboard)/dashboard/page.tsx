'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, ShieldCheck, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('http://localhost:8001/api/admin/dashboard/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Teachers', value: stats?.totalTeachers || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total AI Chats', value: stats?.totalChats || 0, icon: MessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals || 0, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-xl ${stat.bg}`}>
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md h-80">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {stats?.recentActivity?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Activity size={32} className="mb-2 opacity-50" />
              <p>No recent activities found.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {/* Activity items would go here */}
            </ul>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md h-80">
          <h2 className="text-xl font-semibold mb-4">AI Usage Trends</h2>
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
             <Activity size={32} className="mb-2 opacity-50" />
             <p>Not enough data to display trends.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
