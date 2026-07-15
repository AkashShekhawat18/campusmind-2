'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Database, Key, Activity, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AIMarketplacePage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'providers' | 'models' | 'keys'>('analytics');
  
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchProviders = async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
    const res = await fetch('http://localhost:5000/api/admin/marketplace/providers', { headers: { 'Authorization': `Bearer ${token}` }});
    if(res.ok) setProviders(await res.json());
  };

  const fetchModels = async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
    const res = await fetch('http://localhost:5000/api/admin/marketplace/models', { headers: { 'Authorization': `Bearer ${token}` }});
    if(res.ok) setModels(await res.json());
  };

  const fetchKeys = async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
    const res = await fetch('http://localhost:5000/api/admin/marketplace/keys', { headers: { 'Authorization': `Bearer ${token}` }});
    if(res.ok) setKeys(await res.json());
  };

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
    const res = await fetch('http://localhost:5000/api/admin/marketplace/analytics', { headers: { 'Authorization': `Bearer ${token}` }});
    if(res.ok) setAnalytics(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'providers') fetchProviders();
    if (activeTab === 'models') fetchModels();
    if (activeTab === 'keys') { fetchKeys(); fetchProviders(); }
  }, [activeTab]);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Provider Marketplace</h1>
        <p className="text-gray-400">Manage LLM Providers, Models, API Keys, and view routing analytics.</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Activity size={18} /> Analytics</button>
        <button onClick={() => setActiveTab('providers')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'providers' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Network size={18} /> Providers</button>
        <button onClick={() => setActiveTab('models')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'models' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Database size={18} /> Models</button>
        <button onClick={() => setActiveTab('keys')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'keys' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Key size={18} /> API Keys</button>
      </div>

      <div className="flex-1 overflow-y-auto" data-lenis-prevent>
        <AnimatePresence mode="wait">
          
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && analytics && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-gray-400 font-medium mb-1">Total Providers</h3>
                  <p className="text-3xl font-bold text-white">{analytics.totalProviders}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-gray-400 font-medium mb-1">Active Models</h3>
                  <p className="text-3xl font-bold text-white">{analytics.activeModels}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-gray-400 font-medium mb-1">Total API Requests</h3>
                  <p className="text-3xl font-bold text-white">{analytics.totalRequests}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-gray-400 font-medium mb-1">Requests Today</h3>
                  <p className="text-3xl font-bold text-white">{analytics.todayRequests}</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Provider Health</h3>
                <div className="space-y-3">
                  {analytics.providerHealth?.map((p: any) => (
                    <div key={p.providerName} className="flex justify-between items-center p-3 bg-black/30 rounded-xl border border-white/5">
                      <span className="text-white font-medium">{p.providerName}</span>
                      <div className="flex items-center gap-2">
                        {p.status === 'Healthy' && <CheckCircle size={16} className="text-green-500" />}
                        {p.status === 'Slow' && <CheckCircle size={16} className="text-yellow-500" />}
                        {p.status === 'Offline' && <XCircle size={16} className="text-red-500" />}
                        <span className={`text-sm ${p.status==='Healthy'?'text-green-400':p.status==='Slow'?'text-yellow-400':'text-red-400'}`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PROVIDERS TAB */}
          {activeTab === 'providers' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Configured Providers</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"><Plus size={16}/> Add Provider</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {providers.map(p => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white">{p.providerName}</h3>
                        <p className="text-sm text-gray-400">{p.apiBaseUrl}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${p.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{p.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg flex gap-2 items-center"><Edit2 size={14}/> Edit</button>
                      <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg flex gap-2 items-center"><Trash2 size={14}/> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MODELS TAB */}
          {activeTab === 'models' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Model Fleet</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"><Plus size={16}/> Add Model</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {models.map(m => (
                  <div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">{m.displayName} {m.premium && <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Premium</span>}</h3>
                        <p className="text-xs text-blue-400 font-medium">{m.provider.providerName} • {m.modelName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${m.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{m.enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{m.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {m.supportsVision && <span className="px-2 py-1 bg-white/10 text-white text-[10px] rounded border border-white/5">Vision</span>}
                      {m.supportsReasoning && <span className="px-2 py-1 bg-white/10 text-white text-[10px] rounded border border-white/5">Reasoning</span>}
                      {m.supportsPdf && <span className="px-2 py-1 bg-white/10 text-white text-[10px] rounded border border-white/5">PDF/Long Context</span>}
                      <span className="px-2 py-1 bg-white/10 text-white text-[10px] rounded border border-white/5">Tokens: {m.maxTokens}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* API KEYS TAB */}
          {activeTab === 'keys' && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">API Keys & Rotation</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"><Plus size={16}/> Add API Key</button>
              </div>
              <div className="overflow-hidden bg-white/5 border border-white/10 rounded-2xl">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-white/5 border-b border-white/10 text-white">
                    <tr>
                      <th className="p-4 font-medium">Key Name</th>
                      <th className="p-4 font-medium">Provider</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Usage Today</th>
                      <th className="p-4 font-medium">Total Usage</th>
                      <th className="p-4 font-medium">Last Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map(k => (
                      <tr key={k.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-white">{k.keyName}</td>
                        <td className="p-4">{k.provider.providerName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${k.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{k.status}</span>
                        </td>
                        <td className="p-4">{k.requestsToday} / {k.dailyLimit}</td>
                        <td className="p-4">{k.usageCount}</td>
                        <td className="p-4">{k.lastUsed ? new Date(k.lastUsed).toLocaleString() : 'Never'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
