'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, MessageSquare, FileText, BookOpen,
  Settings, LogOut, Menu, X, ChevronRight, Sun, Moon, Sparkles, Brain,
  CalendarDays, ClipboardList, ChevronDown, PlusCircle, Wand2,
  BookCheck, HelpCircle, PenTool, FileCheck, Clock, CheckCircle2,
  BarChart3, Bot, FileCog
} from 'lucide-react';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';

const sidebarItems = [
  { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Campus GPT', href: '/teacher/dashboard/campus-gpt', icon: MessageSquare },
];

const assessmentCenterItems = [
  { label: 'Dashboard', href: '/teacher/dashboard/assessment-center', icon: LayoutDashboard },
  { label: 'Create Assessment', href: '/teacher/dashboard/assessment-center/create', icon: PlusCircle },
  { label: 'AI Generator', href: '/teacher/dashboard/assessment-center/ai-generator', icon: Wand2 },
  { label: 'Assignments', href: '/teacher/dashboard/assessment-center/assignments', icon: BookCheck },
  { label: 'Quiz Generator', href: '/teacher/dashboard/assessment-center/quiz-generator', icon: HelpCircle },
  { label: 'Test Paper Generator', href: '/teacher/dashboard/assessment-center/test-generator', icon: PenTool },
  { label: 'AI Assessment Assistant', href: '/teacher/dashboard/assessment-center/assistant', icon: Bot },
  { label: 'Drafts', href: '/teacher/dashboard/assessment-center/drafts', icon: FileCog },
  { label: 'Active', href: '/teacher/dashboard/assessment-center/active', icon: FileCheck },
  { label: 'Scheduled', href: '/teacher/dashboard/assessment-center/scheduled', icon: Clock },
  { label: 'Completed', href: '/teacher/dashboard/assessment-center/completed', icon: CheckCircle2 },
  { label: 'Results', href: '/teacher/dashboard/assessment-center/results', icon: FileText },
  { label: 'Analytics', href: '/teacher/dashboard/assessment-center/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/teacher/dashboard/assessment-center/settings', icon: Settings },
];

const sidebarItemsAfter = [
  { label: 'Calendar', href: '/teacher/dashboard/calendar', icon: CalendarDays },
  { label: 'BITS Pilani Resources', href: '/teacher/dashboard/resources', icon: BookOpen },
  { label: 'PYQ Analyzer', href: '/teacher/dashboard/pyq-analyzer', icon: Brain },
  { label: 'PYQ Library', href: '/teacher/dashboard/pyq-library', icon: FileText },
  { label: 'Settings', href: '/teacher/dashboard/settings', icon: Settings },
];

// Combined flat list for top bar breadcrumb lookup
const allNavItems = [
  ...sidebarItems,
  ...assessmentCenterItems,
  ...sidebarItemsAfter,
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

  // Auto-expand assessment center when any sub-route is active
  const isAssessmentRoute = pathname.startsWith('/teacher/dashboard/assessment-center');
  const [assessmentOpen, setAssessmentOpen] = useState(isAssessmentRoute);

  useEffect(() => {
    if (isAssessmentRoute) setAssessmentOpen(true);
  }, [isAssessmentRoute]);

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

  // Resolve current page label for top bar breadcrumb
  const getCurrentLabel = () => {
    if (isAssessmentRoute) {
      const sub = assessmentCenterItems.find(i => pathname === i.href);
      return sub ? `Assessment Center › ${sub.label}` : 'Assessment Center';
    }
    const match = [...sidebarItems, ...sidebarItemsAfter].find(i => pathname === i.href || pathname.startsWith(i.href + '/'));
    return match?.label || 'Dashboard';
  };

  // Render a single sidebar nav item (shared between all sections)
  const renderNavItem = (item: { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }) => {
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
              {/* Top items: Dashboard, Campus GPT */}
              {sidebarItems.map(renderNavItem)}

              {/* Assessment Center - Collapsible Group */}
              <div className="pt-1">
                <motion.button
                  onClick={() => setAssessmentOpen(!assessmentOpen)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isAssessmentRoute
                      ? (isDark ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'bg-black/10 text-black shadow-lg')
                      : (isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-black/60 hover:text-black hover:bg-black/5')
                  }`}
                >
                  <ClipboardList size={18} className={isAssessmentRoute ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''} />
                  Assessment Center
                  <motion.div
                    animate={{ rotate: assessmentOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-auto"
                  >
                    <ChevronDown size={14} className="opacity-40" />
                  </motion.div>
                </motion.button>

                <AnimatePresence initial={false}>
                  {assessmentOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`ml-3 pl-3 mt-1 space-y-0.5 border-l ${
                        isDark ? 'border-white/5' : 'border-black/5'
                      }`}>
                        {assessmentCenterItems.map((item) => {
                          const isActive = pathname === item.href;
                          const Icon = item.icon;
                          return (
                            <Link key={item.href} href={item.href}>
                              <motion.div
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                                  isActive
                                    ? (isDark ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'bg-black/10 text-black shadow-lg')
                                    : (isDark ? 'text-white/50 hover:text-white hover:bg-white/5' : 'text-black/50 hover:text-black hover:bg-black/5')
                                }`}
                              >
                                <Icon size={16} className={isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''} />
                                {item.label}
                                {isActive && (
                                  <ChevronRight size={12} className="ml-auto opacity-40" />
                                )}
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Remaining items: Calendar, Resources, PYQ Analyzer, PYQ Library, Settings */}
              {sidebarItemsAfter.map(renderNavItem)}
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
              {getCurrentLabel()}
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
