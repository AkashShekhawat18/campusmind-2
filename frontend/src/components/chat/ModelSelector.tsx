import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Lock, Zap, Eye, Brain, Code, FileText, FlaskConical, Check, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';

export type AIModel = {
  id: string;
  provider: string;
  modelName: string;
  displayName: string;
  description: string;
  category: string;
  enabled: boolean;
  premium: boolean;
  vision: boolean;
  reasoning: boolean;
  coding: boolean;
  pdf: boolean;
  math: boolean;
  status: string;
};

type ModelSelectorProps = {
  selectedModelId: string;
  onModelSelect: (modelId: string, isPremium: boolean) => void;
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModelId, onModelSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchModels();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        // Always ensure 'Auto' is first
        const autoModel = {
          id: 'auto',
          provider: 'Auto',
          modelName: 'auto',
          displayName: '⚡ Auto (Recommended)',
          description: 'MALPHOR automatically chooses the best model based on the request.',
          category: 'MALPHOR Models',
          enabled: true,
          premium: false,
          vision: true,
          reasoning: true,
          coding: true,
          pdf: true,
          math: true,
          status: 'ACTIVE'
        };
        setModels([autoModel, ...data]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  const filteredModels = models.filter(m => 
    m.displayName.toLowerCase().includes(search.toLowerCase()) || 
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(filteredModels.map(m => m.category)));

  if (!mounted) {
    return (
      <div className="relative">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 bg-white/5 border-white/10 text-white opacity-50">
          <span className="text-sm font-medium truncate max-w-[150px]">Loading...</span>
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 ${
          isDark 
            ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
            : 'bg-black/5 border-black/10 hover:bg-black/10 text-black'
        } ${isOpen ? 'ring-2 ring-blue-500/50' : ''}`}
      >
        <span className="text-sm font-medium truncate max-w-[150px]">
          {selectedModel?.displayName || 'Select Model'}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute bottom-full mb-2 left-0 w-80 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden z-50 flex flex-col max-h-[400px] ${
              isDark 
                ? 'bg-[#1a1a1c]/90 border-white/10 shadow-black/50 text-white' 
                : 'bg-white/90 border-black/10 shadow-black/10 text-black'
            }`}
          >
            {/* Search */}
            <div className={`p-3 border-b ${isDark ? 'border-white/10' : 'border-black/5'}`}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-black/40' : 'bg-gray-100'}`}>
                <Search size={14} className="opacity-50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models..."
                  className="bg-transparent border-none outline-none text-sm w-full"
                  autoFocus
                />
              </div>
            </div>

            {/* Model List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
              {loading ? (
                <div className="p-4 text-center text-sm opacity-50 flex items-center justify-center gap-2">
                  <Activity size={14} className="animate-pulse" /> Loading models...
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="p-4 text-center text-sm opacity-50">No models found.</div>
              ) : (
                categories.map((category) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1">
                      {category}
                    </div>
                    {filteredModels.filter(m => m.category === category).map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onModelSelect(model.id, model.premium);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all relative overflow-hidden group ${
                          selectedModelId === model.id 
                            ? (isDark ? 'bg-blue-500/20' : 'bg-blue-50') 
                            : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')
                        }`}
                      >
                        {/* Status dot */}
                        {model.status === 'ACTIVE' ? (
                           <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        ) : (
                           <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm font-semibold truncate ${selectedModelId === model.id ? 'text-blue-500' : ''}`}>
                              {model.displayName}
                            </span>
                            {model.premium && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold shadow-sm">
                                <Lock size={8} /> PREMIUM
                              </span>
                            )}
                          </div>
                          
                          {model.description && (
                            <p className="text-xs opacity-60 leading-tight mb-1.5 line-clamp-2">
                              {model.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mt-1">
                            {model.id === 'auto' && (
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}><Zap size={8} /> Fast</span>
                            )}
                            {model.vision && model.id !== 'auto' && (
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}><Eye size={8} /> Vision</span>
                            )}
                            {model.reasoning && model.id !== 'auto' && (
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}><Brain size={8} /> Reasoning</span>
                            )}
                            {model.coding && model.id !== 'auto' && (
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1 ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}><Code size={8} /> Coding</span>
                            )}
                          </div>
                        </div>

                        {selectedModelId === model.id && (
                          <Check size={16} className="text-blue-500 absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
