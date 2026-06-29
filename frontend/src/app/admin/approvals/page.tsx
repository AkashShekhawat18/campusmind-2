'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, X, Clock, ShieldAlert } from 'lucide-react';

interface ApprovalData {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  createdAt: string;
  name?: string;
  email?: string;
}

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch('http://localhost:5000/api/admin/approvals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setApprovals(data);
      } else {
        throw new Error('Failed to fetch approvals');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleUpdate = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch(`http://localhost:5000/api/admin/approvals/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setApprovals(approvals.map(a => a.id === id ? { ...a, status: newStatus } : a));
      } else {
        alert(`Failed to ${newStatus.toLowerCase()} approval`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Pending Approvals</h1>
        <p className="text-gray-400">Review and moderate user registrations and requests.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl">
          {error}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 text-sm font-semibold text-gray-300">Request Type</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Details</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Requested On</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {approvals.map((approval) => (
                <tr key={approval.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                        {approval.entityType === 'TEACHER' ? <BookOpen size={20} /> : <ShieldAlert size={20} />}
                      </div>
                      <span className="font-medium text-white">{approval.entityType} Registration</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-medium">{approval.name || 'Unknown User'}</span>
                      <span className="text-gray-400 text-xs">{approval.email || 'No Email'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-max ${
                      approval.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      approval.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {approval.status === 'PENDING' && <Clock size={12} />}
                      {approval.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {approval.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleUpdate(approval.id, 'APPROVED')}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdate(approval.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    )}
                    {approval.status !== 'PENDING' && (
                      <span className="text-gray-500 text-sm italic">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
              {approvals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No pending approvals at the moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
