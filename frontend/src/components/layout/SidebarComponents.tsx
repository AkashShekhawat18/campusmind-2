'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Sun, Moon, LogOut } from 'lucide-react';

export type ThemeRole = 'teacher' | 'student' | 'admin';

const accents = {
  teacher: {
    bgLight: 'bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    bgDark: 'bg-blue-500/15 shadow-[0_0_15px_rgba(96,165,250,0.15)] border border-blue-500/20',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300',
    barLight: 'bg-blue-600',
    barDark: 'bg-blue-400',
    iconLight: 'text-blue-600',
    iconDark: 'text-blue-400',
  },
  student: {
    bgLight: 'bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]',
    bgDark: 'bg-cyan-500/15 shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-cyan-500/20',
    textLight: 'text-cyan-700',
    textDark: 'text-cyan-300',
    barLight: 'bg-cyan-600',
    barDark: 'bg-cyan-400',
    iconLight: 'text-cyan-600',
    iconDark: 'text-cyan-400',
  },
  admin: {
    bgLight: 'bg-blue-600/10 shadow-[0_0_15px_rgba(37,99,235,0.1)]',
    bgDark: 'bg-blue-500/15 shadow-[0_0_15px_rgba(96,165,250,0.15)] border border-blue-500/20',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300',
    barLight: 'bg-blue-600',
    barDark: 'bg-blue-400',
    iconLight: 'text-blue-600',
    iconDark: 'text-blue-400',
  },
};

interface SidebarItemProps {
  label: string;
  href?: string;
  icon: React.ElementType;
  isActive: boolean;
  isDark: boolean;
  role: ThemeRole;
  collapsed?: boolean;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
  small?: boolean;
}

export function SidebarItem({
  label,
  href,
  icon: Icon,
  isActive,
  isDark,
  role,
  collapsed,
  onClick,
  rightElement,
  className = '',
  small = false,
}: SidebarItemProps) {
  const accent = accents[role];

  const content = (
    <motion.div
      whileHover={{ scale: 1.01, x: collapsed ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex items-center ${collapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-xl transition-all duration-200 ease-out cursor-pointer group overflow-hidden ${
        small ? 'text-[13px]' : 'text-sm'
      } ${
        isActive
          ? `${isDark ? accent.bgDark : accent.bgLight} font-semibold ${isDark ? accent.textDark : accent.textLight}`
          : `font-medium ${isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-black/60 hover:text-black hover:bg-black/5'}`
      } ${className}`}
    >
      {/* Left Accent Bar for Active State */}
      {isActive && !collapsed && (
        <div className={`absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md ${isDark ? accent.barDark : accent.barLight}`} />
      )}

      {/* Glow Effect */}
      {isActive && (
        <div className={`absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-r from-transparent ${isDark ? 'to-white/10' : 'to-black/5'} mix-blend-overlay`} />
      )}

      <Icon
        size={small ? 16 : 18}
        className={`${collapsed ? '' : 'mr-3 shrink-0'} transition-colors duration-200 ${
          isActive
            ? `${isDark ? accent.iconDark : accent.iconLight}`
            : 'group-hover:text-current'
        }`}
      />
      
      {!collapsed && (
        <span className="truncate flex-1 tracking-tight">
          {label}
        </span>
      )}

      {!collapsed && (rightElement || (isActive && href && (
        <ChevronRight size={14} className="ml-2 opacity-40 shrink-0" />
      )))}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

interface SidebarGroupProps {
  label: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  role: ThemeRole;
  children: React.ReactNode;
  isActive?: boolean;
}

export function SidebarGroup({
  label,
  icon: Icon,
  isOpen,
  onToggle,
  isDark,
  role,
  children,
  isActive = false,
}: SidebarGroupProps) {
  const accent = accents[role];

  return (
    <div className="pt-1">
      <motion.div
        onClick={onToggle}
        whileHover={{ scale: 1.01, x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out cursor-pointer group ${
          isActive
            ? `${isDark ? accent.bgDark : accent.bgLight} ${isDark ? accent.textDark : accent.textLight}`
            : `${isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-black/60 hover:text-black hover:bg-black/5'}`
        }`}
      >
        <Icon size={18} className={isActive ? (isDark ? accent.iconDark : accent.iconLight) : 'group-hover:text-current transition-colors'} />
        <span className="tracking-tight">{label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="ml-auto"
        >
          <ChevronDown size={14} className="opacity-40 shrink-0" />
        </motion.div>
      </motion.div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`ml-[22px] pl-3 mt-1 space-y-0.5 border-l ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SidebarUserCardProps {
  name: string;
  roleText: string;
  isDark: boolean;
  role: ThemeRole;
  collapsed?: boolean;
}

export function SidebarUserCard({ name, roleText, isDark, role, collapsed }: SidebarUserCardProps) {
  const initial = name ? name.charAt(0).toUpperCase() : roleText.charAt(0);
  const gradient = role === 'teacher' || role === 'admin' 
    ? 'from-blue-500 to-cyan-400' 
    : 'from-cyan-400 to-blue-500';

  return (
    <div className={`mt-2 p-2 rounded-xl flex items-center gap-3 transition-colors duration-200 ${
      isDark ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/5' : 'bg-black/[0.03] hover:bg-black/[0.06] border border-black/5'
    } ${collapsed ? 'justify-center' : ''}`}>
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0`}>
        {initial}
      </div>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
            {name || roleText}
          </div>
          <div className={`text-[11px] font-medium truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            {roleText}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarThemeToggle({ isDark, onThemeToggle, collapsed }: { isDark: boolean, onThemeToggle: () => void, collapsed?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onThemeToggle}
      className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-3'} py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
        isDark ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-black/60 hover:text-black hover:bg-black/5'
      }`}
    >
      <div className={`${collapsed ? '' : 'mr-3 shrink-0'}`}>
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </div>
      {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </motion.button>
  );
}

export function SidebarLogout({ isDark, onLogout, collapsed }: { isDark: boolean, onLogout: () => void, collapsed?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onLogout}
      className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-3'} py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group ${
        isDark ? 'text-red-400/80 hover:text-red-400 hover:bg-red-500/10' : 'text-red-600/80 hover:text-red-600 hover:bg-red-50'
      }`}
    >
      <div className={`${collapsed ? '' : 'mr-3 shrink-0'} group-hover:scale-110 transition-transform duration-200`}>
        <LogOut size={18} />
      </div>
      {!collapsed && <span>Logout</span>}
    </motion.button>
  );
}
