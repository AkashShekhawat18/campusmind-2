'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export default function StudentLogin() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl relative glow-border">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-electric-blue/20 flex items-center justify-center mb-4">
          <GraduationCap className="w-6 h-6 text-neon-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Student Login</h2>
        <p className="text-foreground/60 text-sm mt-2 text-center">Enter your credentials to access the portal</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Email</label>
          <input type="email" className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" placeholder="student@campusmind.edu" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
          <input type="password" className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" placeholder="••••••••" />
        </div>
        
        <div className="flex justify-end">
          <Link href="#" className="text-sm text-neon-cyan hover:underline">Forgot Password?</Link>
        </div>

        <button type="submit" className="w-full py-3 rounded-lg bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/90 transition-colors mt-6 shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer">
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-foreground/60">
        Account approval required from Administrator before activation.
      </div>
      
      <div className="mt-6 pt-6 border-t border-foreground/10 text-center">
        <p className="text-foreground/60 text-sm">
          Don&apos;t have an account? <Link href="/student/register" className="text-neon-cyan hover:underline font-medium">Register here</Link>
        </p>
      </div>
    </motion.div>
  );
}
