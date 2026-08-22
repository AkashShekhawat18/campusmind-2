'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, BookOpen, BrainCircuit, 
  MessageSquare, FileText, Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Building2, GraduationCap, CalendarDays
} from 'lucide-react';
import { SidebarItem, SidebarLogout } from '@/components/layout/SidebarComponents';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Approvals', href: '/admin/approvals', icon: BookOpen },
  { name: 'Colleges & Depts', href: '/admin/erp/colleges', icon: Building2 },
  { name: 'Programs & Branches', href: '/admin/erp/programs', icon: GraduationCap },
  { name: 'Academics', href: '/admin/erp/semesters', icon: CalendarDays },
  { name: 'Campus GPT', href: '/admin/gpt', icon: BrainCircuit },
  { name: 'AI Marketplace', href: '/admin/ai-marketplace', icon: BrainCircuit },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside 
      animate={{ width: collapsed ? 80 : 256 }}
      className="bg-black/95 border-r border-white/10 text-white h-screen sticky top-0 flex flex-col z-50 transition-all"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {!collapsed && <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">CampusAdmin</h1>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors mx-auto"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            label={item.name}
            href={item.href}
            icon={item.icon}
            isActive={pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin/dashboard')}
            isDark={true}
            role="admin"
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <SidebarLogout
          isDark={true}
          collapsed={collapsed}
          onLogout={() => {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminName');
            localStorage.removeItem('adminEmail');
            window.location.href = '/admin/login';
          }}
        />
      </div>
    </motion.aside>
  );
}
