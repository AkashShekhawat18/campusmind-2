'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Loader2, User, Building } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8001/api/admin/approvals');
      if (!res.ok) throw new Error('Failed to fetch approvals');
      const data = await res.json();
      setApprovals(data);
    } catch (err) {
      setError('Could not connect to the backend server. Please ensure the admin service is running on port 8001.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await fetch(`http://localhost:8001/api/admin/approvals/${id}/${action}`, {
        method: 'POST'
      });
      fetchApprovals();
    } catch (err) {
      // Ignore
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-8 text-center">
        <Loader2 size={40} className="text-purple-400 animate-spin mb-4" />
        <p className="text-gray-400">Loading approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldCheck size={40} className="text-red-500 opacity-80" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Connection Error</h1>
        <p className="text-red-400 max-w-md">{error}</p>
      </div>
    );
  }

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');

  if (pendingApprovals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <ShieldCheck size={40} className="text-amber-500 opacity-80" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Approval Center</h1>
        <p className="text-gray-400 max-w-md">
          There are currently no pending approvals for students, teachers, or colleges. You're all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Approval Center</h1>
          <p className="text-gray-400 text-sm">Review and manage pending registrations and access requests.</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium text-sm flex items-center gap-2">
          <ShieldCheck size={18} />
          {pendingApprovals.length} Pending
        </div>
      </div>

      <div className="grid gap-4">
        {pendingApprovals.map((approval) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={approval.id}
            className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                approval.entityType === 'COLLEGE' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {approval.entityType === 'COLLEGE' ? <Building size={24} /> : <User size={24} />}
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">{approval.requestedBy}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-300">
                    {approval.entityType}
                  </span>
                  • Requested on {new Date(approval.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(approval.id, 'reject')}
                disabled={actionLoading === approval.id}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                title="Reject"
              >
                {actionLoading === approval.id ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
              </button>
              <button
                onClick={() => handleAction(approval.id, 'approve')}
                disabled={actionLoading === approval.id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {actionLoading === approval.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Approve
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
