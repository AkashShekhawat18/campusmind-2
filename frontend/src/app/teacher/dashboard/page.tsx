'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  FileText, BookOpen, MessageSquare, Upload, Sparkles,
  ArrowRight, Clock, TrendingUp
} from 'lucide-react';

interface DashboardStats {
  questionPapers: number;
  resources: number;
  chats: number;
}

export default function TeacherDashboard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const [stats, setStats] = useState<DashboardStats>({ questionPapers: 0, resources: 0, chats: 0 });
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [recentResources, setRecentResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('teacherToken');
      const res = await fetch('http://localhost:5000/api/teacher/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentPapers(data.recentPapers || []);
        setRecentResources(data.recentResources || []);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Question Papers', value: stats.questionPapers, icon: FileText, color: 'from-blue-500 to-cyan-400', href: '/teacher/dashboard/pyq-analyzer' },
    { label: 'Resources Shared', value: stats.resources, icon: BookOpen, color: 'from-purple-500 to-pink-400', href: '/teacher/dashboard/resources' },
    { label: 'AI Conversations', value: stats.chats, icon: MessageSquare, color: 'from-green-500 to-emerald-400', href: '/teacher/dashboard/campus-gpt' },
  ];

  const quickActions = [
    { label: 'Upload Question Paper', icon: Upload, href: '/teacher/dashboard/pyq-analyzer', desc: 'Analyze PYQs for similarity' },
    { label: 'Start AI Chat', icon: Sparkles, href: '/teacher/dashboard/campus-gpt', desc: 'Get help from CampusGPT' },
    { label: 'Upload Resource', icon: BookOpen, href: '/teacher/dashboard/resources', desc: 'Share study materials' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as any } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Welcome back{typeof window !== 'undefined' && localStorage.getItem('teacherName') ? `, ${localStorage.getItem('teacherName')?.split(' ')[0]}` : ''} 👋
        </h1>
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Here&apos;s an overview of your teaching activity.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-shadow ${
                  isDark
                    ? 'bg-[#111113] border border-white/5 hover:border-white/10 shadow-xl shadow-black/20'
                    : 'bg-white border border-black/5 hover:border-black/10 shadow-xl shadow-black/5'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-2xl -translate-y-8 translate-x-8`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="text-3xl font-bold mb-1">{card.value}</div>
                <div className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>{card.label}</div>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    isDark
                      ? 'border-white/5 hover:bg-white/5 hover:border-white/10'
                      : 'border-black/5 hover:bg-black/5 hover:border-black/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{action.desc}</div>
                  </div>
                  <ArrowRight size={16} className="opacity-30" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Papers */}
        <div className={`rounded-2xl p-6 border ${
          isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            Recent Question Papers
          </h3>
          {recentPapers.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No question papers uploaded yet</p>
              <Link href="/teacher/dashboard/pyq-analyzer">
                <span className="text-xs text-blue-400 hover:underline mt-1 inline-block">Upload your first PYQ →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPapers.map((paper: any) => (
                <div key={paper.id} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    {paper.year?.toString().slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{paper.title}</div>
                    <div className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      Sem {paper.semester} • {paper.subject?.name || 'Unclassified'}
                    </div>
                  </div>
                  <Clock size={12} className="opacity-30" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Resources */}
        <div className={`rounded-2xl p-6 border ${
          isDark ? 'bg-[#111113] border-white/5' : 'bg-white border-black/5'
        }`}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-purple-400" />
            Recent Resources
          </h3>
          {recentResources.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No resources shared yet</p>
              <Link href="/teacher/dashboard/resources">
                <span className="text-xs text-purple-400 hover:underline mt-1 inline-block">Share your first resource →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResources.map((resource: any) => (
                <div key={resource.id} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} transition-colors`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                    {resource.fileType}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{resource.title}</div>
                    <div className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {resource.department} • Sem {resource.semester}
                    </div>
                  </div>
                  <Clock size={12} className="opacity-30" />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
