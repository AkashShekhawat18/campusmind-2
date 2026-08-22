'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('student@malphor.ai');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // First Login states
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.requirePasswordChange) {
        setRequirePasswordChange(true);
        setTempToken(data.tempToken);
        return;
      }

      if (data.role !== 'STUDENT' && data.role !== 'ADMIN') {
        throw new Error('Access denied. Students only.');
      }

      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName', data.name);
      localStorage.setItem('studentEmail', data.email);
      if (data.officialId) localStorage.setItem('studentOfficialId', data.officialId);
      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password-first-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');

      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName', data.name);
      localStorage.setItem('studentEmail', data.email);
      if (data.officialId) localStorage.setItem('studentOfficialId', data.officialId);
      
      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('student@malphor.ai');
    setPassword('student123');
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@malphor.ai', password: 'student123' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.role !== 'STUDENT' && data.role !== 'ADMIN') {
        throw new Error('Access denied. Students only.');
      }

      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName', data.name);
      localStorage.setItem('studentEmail', data.email);
      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError('');
      
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
          role: 'STUDENT'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Login failed');

      if (data.requirePasswordChange) {
        setRequirePasswordChange(true);
        setTempToken(data.tempToken);
        return;
      }

      if (data.role !== 'STUDENT' && data.role !== 'ADMIN') {
        throw new Error('Access denied. Students only.');
      }

      localStorage.setItem('studentToken', data.token);
      localStorage.setItem('studentName', data.name);
      localStorage.setItem('studentEmail', data.email);
      if (data.officialId) localStorage.setItem('studentOfficialId', data.officialId);
      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl relative glow-border">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-electric-blue/20 flex items-center justify-center mb-4">
          <GraduationCap className="w-6 h-6 text-neon-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Student Login</h2>
        <p className="text-foreground/60 text-sm mt-2 text-center">Enter your credentials to access the portal</p>
      </div>

      {requirePasswordChange ? (
        <form className="space-y-4" onSubmit={handlePasswordChange}>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          <div className="text-center mb-4 text-neon-cyan font-medium">
            First login requires a password change.
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" 
              placeholder="••••••••" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" 
              placeholder="••••••••" 
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/90 transition-colors mt-6 shadow-[0_0_15px_rgba(0,229,255,0.4)] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set Password & Login'}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Email or Official ID</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" 
              placeholder="student@malphor.edu or STU24..." 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-neon-cyan transition-colors" 
              placeholder="••••••••" 
              required
            />
          </div>
          
          <div className="flex justify-end">
            <Link href="#" className="text-sm text-neon-cyan hover:underline">Forgot Password?</Link>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-neon-cyan text-black font-semibold hover:bg-neon-cyan/90 transition-colors mt-6 shadow-[0_0_15px_rgba(0,229,255,0.4)] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>

          <button 
            type="button" 
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-lg border border-neon-cyan/50 text-neon-cyan font-semibold hover:bg-neon-cyan/10 transition-colors mt-3 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Demo Login'}
          </button>

          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="text-sm text-foreground/60">Or continue with</div>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError('Google Login Failed')}
              theme="filled_black"
              shape="pill"
            />
          </div>
        </form>
      )}

      {!requirePasswordChange && (
        <>
          <div className="mt-6 text-center text-sm text-foreground/60">
            Account approval required from Administrator before activation.
          </div>
          
          <div className="mt-6 pt-6 border-t border-foreground/10 text-center">
            <p className="text-foreground/60 text-sm">
              Don&apos;t have an account? <Link href="/student/register" className="text-neon-cyan hover:underline font-medium">Register here</Link>
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
