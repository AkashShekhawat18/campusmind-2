'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export default function TeacherLogin() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl relative glow-border">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-electric-violet/20 flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-electric-violet" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Teacher Login</h2>
        <p className="text-foreground/60 text-sm mt-2 text-center">Enter your credentials to access the portal</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Email</label>
          <input type="email" className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="faculty@campusmind.edu" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
          <input type="password" className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="••••••••" />
        </div>
        
        <div className="flex justify-end">
          <Link href="#" className="text-sm text-electric-violet hover:underline">Forgot Password?</Link>
        </div>

        <button type="submit" className="w-full py-3 rounded-lg bg-electric-violet text-foreground font-semibold hover:bg-electric-violet/90 transition-colors mt-6 shadow-[0_0_15px_rgba(138,43,226,0.4)] cursor-pointer">
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-foreground/60">
        Account approval required from Administrator before activation.
      </div>
      
      <div className="mt-6 pt-6 border-t border-foreground/10 text-center">
        <p className="text-foreground/60 text-sm">
          Don&apos;t have an account? <Link href="/teacher/register" className="text-electric-violet hover:underline font-medium">Register here</Link>
        </p>
      </div>
    </motion.div>
  );
}
