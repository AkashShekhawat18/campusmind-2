'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Users, MessageSquare, BookOpen,
  Settings, LogOut, Menu, X, ChevronRight, Sun, Moon, Sparkles, Building, Database, Activity, CheckCircle
} from 'lucide-react';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Approval Center', href: '/admin/approvals', icon: CheckCircle },
  { label: 'User Management', href: '/admin/users', icon: Users },
  { label: 'Student AI History', href: '/admin/ai-history/students', icon: MessageSquare },
  { label: 'Teacher AI History', href: '/admin/ai-history/teachers', icon: MessageSquare },
  { label: 'College Management', href: '/admin/colleges', icon: Building },
  { label: 'Question Bank', href: '/admin/question-bank', icon: BookOpen },
  { label: 'Analytics', href: '/admin/analytics', icon: Activity },
  { label: 'Database Status', href: '/admin/database', icon: Database },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDark ? 'bg-transparent text-[#f5f5f7]' : 'bg-transparent text-[#1a1a1c]'}`}>
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-base font-bold tracking-tight">
                  Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600">Mind</span>
                </span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>

            {/* Admin Badge */}
            <div className={`mx-4 mb-4 px-3 py-2 rounded-xl text-xs font-medium ${
              isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-200'
            }`}>
              🛡️ Admin Portal
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
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
                      <Icon size={18} className={isActive ? (isDark ? 'text-purple-400' : 'text-purple-600') : ''} />
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">System Admin</div>
                  <div className="text-[10px] opacity-50 truncate">admin@campusmind.ai</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <header className={`h-14 flex items-center justify-between px-4 border-b flex-shrink-0 ${
          isDark ? 'border-white/5 bg-[#0a0a0c]/80' : 'border-black/5 bg-[#f0f0f5]/80'
        } backdrop-blur-md`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
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
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
