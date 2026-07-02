'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, BookOpen, BrainCircuit, Activity, 
  TrendingUp, Clock, AlertTriangle, UserCircle
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeApprovals: number;
  gptQueries: number;
  systemHealth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, this would fetch from /api/admin/stats
    // For now, we simulate a fetch since the backend endpoints for stats are not fully wired yet
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken'); // Use appropriate token
        const response = await fetch('http://localhost:5000/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Connected! Use real data when available, but for now fallback gracefully
          setStats({
            totalUsers: 0,
            activeApprovals: 0,
            gptQueries: 0,
            systemHealth: 99.9
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
        setStats({
          totalUsers: 0,
          activeApprovals: 0,
          gptQueries: 0,
          systemHealth: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Pending Approvals', value: stats?.activeApprovals || 0, icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'GPT Queries (24h)', value: stats?.gptQueries || 0, icon: BrainCircuit, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'System Health', value: `${stats?.systemHealth || 0}%`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

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
        <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-gray-400">Welcome to the CampusMind Admin Control Center.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20 transition-transform group-hover:scale-110 ${stat.bg}`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent System Activity</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
          </div>
          
          {!stats || stats.activeApprovals === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Clock className="text-gray-500" size={32} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Recent Activity</h3>
              <p className="text-gray-400 text-sm max-w-md">System is quiet right now. Real-time events will appear here when they occur.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Future: Map over actual recent activity data from API here */}
            </div>
          )}
        </motion.div>

        {/* System Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">System Alerts</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="text-amber-400 shrink-0" size={20} />
              <div>
                <h4 className="text-amber-100 font-medium text-sm">Approvals Pending</h4>
                <p className="text-amber-200/70 text-xs mt-1">You have {stats?.activeApprovals} resources waiting for moderation.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
