'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export default function TeacherRegister() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 rounded-2xl text-center glow-border">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Registration submitted successfully.</h2>
        <p className="text-foreground/60">Awaiting Administrator Approval.</p>
        <Link href="/" className="inline-block mt-8 px-6 py-2 rounded-lg bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors">Return Home</Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl relative glow-border max-w-2xl mx-auto w-full">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-electric-violet/20 flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-electric-violet" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Teacher Registration</h2>
        <p className="text-foreground/60 text-sm mt-2 text-center">Join the faculty network</p>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Full Name</label>
          <input type="text" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="Dr. Jane Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Employee ID</label>
          <input type="text" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="FAC-2026-001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Department</label>
          <input type="text" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="Computer Science" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Email</label>
          <input type="email" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="jane@campusmind.edu" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Phone Number</label>
          <input type="tel" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="+1 (555) 000-0000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
          <input type="password" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Confirm Password</label>
          <input type="password" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="••••••••" />
        </div>
        
        <div className="col-span-1 md:col-span-2 mt-4">
          <button type="submit" className="w-full py-3 rounded-lg bg-electric-violet text-foreground font-semibold hover:bg-electric-violet/90 transition-colors shadow-[0_0_15px_rgba(138,43,226,0.4)] cursor-pointer">
            Register Account
          </button>
        </div>
      </form>
      
      <div className="mt-6 pt-6 border-t border-foreground/10 text-center">
        <p className="text-foreground/60 text-sm">
          Already have an account? <Link href="/teacher/login" className="text-electric-violet hover:underline font-medium">Login here</Link>
        </p>
      </div>
    </motion.div>
  );
}
