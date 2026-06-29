'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8001/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Login failed');
        setLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem('adminToken', data.access_token);

      // Navigate to dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError('Network error. Make sure the backend is running.');
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl relative glow-border max-w-md w-full">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Admin Portal</h2>
        <p className="text-foreground/60 text-sm mt-2 text-center">Sign in to manage CampusMind</p>
      </div>

      {/* Demo credentials hint */}
      <div className="mb-6 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400">
        <strong>Demo Account:</strong> admin@campusmind.ai / admin123
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="admin@campusmind.ai"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-purple-500 transition-colors pr-10"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold transition-all mt-6 shadow-lg shadow-purple-500/25 cursor-pointer ${
            loading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </motion.div>
  );
}
