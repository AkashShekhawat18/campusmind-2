'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export default function StudentRegister() {
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [officialId, setOfficialId] = useState('');
  const [college, setCollege] = useState('BITS Pilani');
  const [branch, setBranch] = useState('Information Technology');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'STUDENT', college, branch, officialId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="w-12 h-12 rounded-xl bg-electric-blue/20 flex items-center justify-center mb-4">
          <GraduationCap className="w-6 h-6 text-neon-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Student Registration</h2>
        <p className="text-foreground/60 text-sm mt-2 text-center">Join the futuristic campus network</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Full Name</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Official ID / Enrollment No.</label>
          <input type="text" value={officialId} onChange={e => setOfficialId(e.target.value)} required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-electric-violet transition-colors" placeholder="2026A7PS0001P" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" placeholder="john@campusmind.edu" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Phone Number</label>
          <input type="tel" required className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" placeholder="+1 (555) 000-0000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">College</label>
          <select value={college} onChange={e => setCollege(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors appearance-none">
            <option value="BITS Pilani">BITS Pilani</option>
            <option value="IIT Bombay">IIT Bombay</option>
            <option value="NIT Trichy">NIT Trichy</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Branch</label>
          <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors appearance-none">
            <option value="Information Technology">Information Technology (IT)</option>
            <option value="Computer Science">Computer Science (CS)</option>
            <option value="Electrical Engineering">Electrical Engineering (EE)</option>
            <option value="Mechanical Engineering">Mechanical Engineering (ME)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Confirm Password</label>
          <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" placeholder="••••••••" />
        </div>
        
        <div className="col-span-1 md:col-span-2 mt-4">
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/90 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 pt-6 border-t border-foreground/10 text-center">
        <p className="text-foreground/60 text-sm">
          Already have an account? <Link href="/student/login" className="text-neon-cyan hover:underline font-medium">Login here</Link>
        </p>
      </div>
    </motion.div>
  );
}
