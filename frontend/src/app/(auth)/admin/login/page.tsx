'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin/dashboard');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl relative glow-border">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-soft-gold/20 flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-soft-gold" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Admin Portal</h2>
        <p className="text-foreground/60 text-sm mt-2 text-center">System Administrators Only</p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Username</label>
          <input type="text" className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-soft-gold transition-colors" placeholder="admin" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
          <input type="password" className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-soft-gold transition-colors" placeholder="••••••••" required />
        </div>

        <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-r from-soft-gold to-yellow-600 text-black font-bold hover:opacity-90 transition-opacity mt-6 shadow-[0_0_15px_rgba(255,215,0,0.4)] cursor-pointer">
          Authorize Access
        </button>
      </form>
    </motion.div>
  );
}
