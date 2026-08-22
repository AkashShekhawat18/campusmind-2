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
import { SidebarItem, SidebarGroup, SidebarUserCard, SidebarThemeToggle, SidebarLogout } from '@/components/layout/SidebarComponents';
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
    return (
      <SidebarItem
        key={item.href}
        label={item.label}
        href={item.href}
        icon={item.icon}
        isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/teacher/dashboard')}
        isDark={isDark}
        role="teacher"
      />
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
              isDark ? 'bg-[#111113]/95 backdrop-blur-xl border-white/5' : 'bg-[#e8e8ed]/95 backdrop-blur-xl border-black/5'
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
              <div className="pt-1 pb-1">
                <SidebarGroup
                  label="Assessment Center"
                  icon={ClipboardList}
                  isOpen={assessmentOpen}
                  onToggle={() => setAssessmentOpen(!assessmentOpen)}
                  isDark={isDark}
                  role="teacher"
                  isActive={isAssessmentRoute}
                >
                  {assessmentCenterItems.map((item) => (
                    <SidebarItem
                      key={item.href}
                      label={item.label}
                      href={item.href}
                      icon={item.icon}
                      isActive={pathname === item.href}
                      isDark={isDark}
                      role="teacher"
                      small
                    />
                  ))}
                </SidebarGroup>
              </div>

              {/* Remaining items: Calendar, Resources, PYQ Analyzer, PYQ Library, Settings */}
              {sidebarItemsAfter.map(renderNavItem)}
            </nav>

            {/* Bottom Actions */}
            <div className={`p-3 space-y-1 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              {mounted && (
                <SidebarThemeToggle isDark={isDark} onThemeToggle={() => setTheme(isDark ? 'light' : 'dark')} />
              )}
              <SidebarLogout isDark={isDark} onLogout={handleLogout} />
              <div className="pt-2">
                <SidebarUserCard name={teacherName} roleText="Teacher" isDark={isDark} role="teacher" />
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
