'use client';
import React from 'react';
import { Search, Bell, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminNavbar() {
  return (
    <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
      <div className="flex items-center w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search across all modules..." 
            className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer border border-white/10 p-1.5 pr-3 rounded-full hover:bg-white/5 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
            AD
          </div>
          <span className="text-sm font-medium text-gray-200">Admin</span>
        </div>
      </div>
    </header>
  );
}
