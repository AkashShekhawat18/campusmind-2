'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trash2, Edit, Shield, ShieldCheck, User, Key } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (id: string, currentRole: string) => {
    const newRole = prompt('Enter new role (STUDENT, TEACHER, ADMIN):', currentRole);
    if (!newRole || !['STUDENT', 'TEACHER', 'ADMIN'].includes(newRole.toUpperCase())) return;
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole.toUpperCase() })
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, role: newRole.toUpperCase() } : u));
      } else {
        alert('Failed to update role');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSuspend = async (id: string, currentStatus: string) => {
    if (currentStatus === 'PENDING' || currentStatus === 'REJECTED') {
      alert('Only active or suspended users can be toggled.');
      return;
    }
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to ${newStatus === 'SUSPENDED' ? 'suspend' : 'reactivate'} this user?`)) return;
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}/suspend`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
      } else {
        alert(`Failed to ${newStatus.toLowerCase()} user`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordChange = async (id: string, name: string) => {
    const newPassword = prompt(`Enter new password for ${name} (minimum 6 characters):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}/password`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`Password for ${name} has been successfully reset!`);
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-400">View and manage all registered accounts in the system.</p>
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
                <th className="p-4 text-sm font-semibold text-gray-300">Name</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Email</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Role</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-300">Joined</th>
                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        {user.role === 'ADMIN' ? <ShieldCheck size={20} /> : user.role === 'TEACHER' ? <Shield size={20} /> : <User size={20} />}
                      </div>
                      <span className="font-medium text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      user.role === 'TEACHER' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-max ${
                      user.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      user.status === 'SUSPENDED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Edit Role"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleToggleSuspend(user.id, user.status)}
                        className={`p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors ${
                          user.status === 'SUSPENDED' ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                        }`}
                        title={user.status === 'SUSPENDED' ? "Reactivate User" : "Suspend User"}
                      >
                        {user.status === 'SUSPENDED' ? <ShieldCheck size={18} /> : <Shield size={18} />}
                      </button>
                      <button 
                        onClick={() => handlePasswordChange(user.id, user.name)}
                        className="p-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-amber-400 hover:text-amber-300 transition-colors"
                        title="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No users found in the system.
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
