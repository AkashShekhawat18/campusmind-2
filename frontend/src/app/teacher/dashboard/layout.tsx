'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, MessageSquare, FileText, BookOpen,
  Settings, LogOut, Menu, X, ChevronRight, Sun, Moon, Sparkles, Brain
, CalendarDays} from 'lucide-react';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';

const sidebarItems = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Campus GPT', href: '/teacher/dashboard/campus-gpt', icon: MessageSquare },
  { label: 'Calendar', href: '/teacher/dashboard/calendar', icon: CalendarDays },
  { label: 'BITS Pilani Resources', href: '/teacher/dashboard/resources', icon: BookOpen },
  { label: 'PYQ Analyzer', href: '/teacher/dashboard/pyq-analyzer', icon: Brain },
  { label: 'PYQ Library', href: '/teacher/dashboard/pyq-library', icon: FileText },
  { label: 'Settings', href: '/teacher/dashboard/settings', icon: Settings },
];

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teacherName, setTeacherName] = useState('');

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('teacherToken');
    const name = localStorage.getItem('teacherName');
    if (!token) {
      router.push('/teacher/login');
      return;
    }
    if (name) setTeacherName(name);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherName');
    localStorage.removeItem('teacherEmail');
    router.push('/teacher/login');
  };

  return (
    <div className={`flex h-screen overflow-hidden w-full transition-colors duration-300 ${isDark ? 'bg-[#0a0a0c] text-[#f5f5f7]' : 'bg-[#f0f0f5] text-[#1a1a1c]'}`}>
      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className={`flex flex-col w-[260px] h-full flex-shrink-0 border-r z-50 ${
              isDark ? 'bg-[#111113] border-white/5' : 'bg-[#e8e8ed] border-black/5'
            }`}
          >
            {/* Logo */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-base font-bold tracking-tight">
                  Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Mind</span>
                </span>
              </Link>
              <button
                title="Close sidebar"
                aria-label="Close sidebar"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>

            {/* Teacher Badge */}
            <div className={`mx-4 mb-4 px-3 py-2 rounded-xl text-xs font-medium ${
              isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              🎓 Teacher Portal
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? (isDark ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'bg-black/10 text-black shadow-lg')
                          : (isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-black/60 hover:text-black hover:bg-black/5')
                      }`}
                    >
                      <Icon size={18} className={isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''} />
                      {item.label}
                      {isActive && (
                        <ChevronRight size={14} className="ml-auto opacity-40" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className={`p-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-black/60 hover:text-black hover:bg-black/5'
                  }`}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isDark ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10' : 'text-red-500/70 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut size={18} />
                Logout
              </button>

              {/* User Info */}
              <div className={`mt-3 px-3 py-2 rounded-xl flex items-center gap-3 ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {teacherName ? teacherName.charAt(0).toUpperCase() : 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{teacherName || 'Teacher'}</div>
                  <div className="text-[10px] opacity-50 truncate">Teacher</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className={`h-14 flex items-center justify-between px-4 border-b flex-shrink-0 relative z-50 ${
          isDark ? 'border-white/5 bg-[#0a0a0c]/80' : 'border-black/5 bg-[#f0f0f5]/80'
        } backdrop-blur-md`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                title="Open sidebar"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <Menu size={20} />
              </button>
            )}
            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              isDark ? 'bg-white/5' : 'bg-black/5'
            }`}>
              {sidebarItems.find(i => pathname.startsWith(i.href))?.label || 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center">
            <WeatherWidget />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
