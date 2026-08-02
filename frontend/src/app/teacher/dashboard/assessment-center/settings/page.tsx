'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Settings, Clock, Bot, Bell, FileDown, Layers, BookMarked, Save, ChevronRight } from 'lucide-react';

interface SettingSection {
  id: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
}

const sections: SettingSection[] = [
  { id: 'deadline', label: 'Default Deadline', desc: 'Set default due dates and late submission policies', icon: Clock, color: 'from-blue-500 to-cyan-400' },
  { id: 'ai', label: 'AI Evaluation', desc: 'Configure automatic grading and feedback generation', icon: Bot, color: 'from-violet-500 to-purple-400' },
  { id: 'notifications', label: 'Notifications', desc: 'Manage reminder and submission notification preferences', icon: Bell, color: 'from-amber-500 to-yellow-400' },
  { id: 'export', label: 'Export Preferences', desc: 'Default formats for PDF and DOCX exports', icon: FileDown, color: 'from-emerald-500 to-green-400' },
  { id: 'rubrics', label: 'Rubric Templates', desc: 'Create and manage reusable rubric templates', icon: Layers, color: 'from-rose-500 to-pink-400' },
  { id: 'questionbank', label: 'Question Banks', desc: 'Organize saved questions into topic-based banks', icon: BookMarked, color: 'from-orange-500 to-amber-400' },
];

export default function AssessmentSettingsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const [activeSection, setActiveSection] = useState('deadline');

  // Settings state
  const [defaultDays, setDefaultDays] = useState(7);
  const [allowLateDefault, setAllowLateDefault] = useState(false);
  const [latePenaltyDefault, setLatePenaltyDefault] = useState(10);
  const [aiAutoGrade, setAiAutoGrade] = useState(true);
  const [aiFeedback, setAiFeedback] = useState(true);
  const [aiReviewRequired, setAiReviewRequired] = useState(true);
  const [notifySubmission, setNotifySubmission] = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);
  const [exportFormat, setExportFormat] = useState('pdf');

  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
    isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-500/50' : 'bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-blue-500'
  }`;

  const toggleClass = (checked: boolean) => `relative w-10 h-6 rounded-full cursor-pointer transition-colors ${
    checked ? 'bg-blue-500' : (isDark ? 'bg-white/10' : 'bg-black/10')
  }`;

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} className={toggleClass(checked)}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'left-5' : 'left-1'}`} />
    </button>
  );

  return (
    <div className={`min-h-full p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-[#f0f0f5]'}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-500 to-gray-400 flex items-center justify-center shadow-lg shadow-slate-500/20">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Configure assessment defaults</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1 space-y-1">
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all ${
                  isActive
                    ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black')
                    : (isDark ? 'text-white/50 hover:bg-white/5' : 'text-black/50 hover:bg-black/[0.03]')
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${sec.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{sec.label}</div>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-40 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className={`lg:col-span-3 rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
          {activeSection === 'deadline' && (
            <div>
              <h3 className="text-base font-semibold mb-5">Default Deadline Settings</h3>
              <div className="space-y-5">
                <div className="max-w-xs">
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Default due days (from creation)</label>
                  <input type="number" min={1} value={defaultDays} onChange={e => setDefaultDays(parseInt(e.target.value) || 7)} className={inputClass} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Allow late submissions by default</div>
                    <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>New assessments will allow late submissions</div>
                  </div>
                  <Toggle checked={allowLateDefault} onChange={setAllowLateDefault} />
                </div>
                {allowLateDefault && (
                  <div className="max-w-xs">
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Default late penalty per day (%)</label>
                    <input type="number" min={0} max={100} value={latePenaltyDefault} onChange={e => setLatePenaltyDefault(parseInt(e.target.value) || 10)} className={inputClass} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div>
              <h3 className="text-base font-semibold mb-5">AI Evaluation Settings</h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Auto-grade MCQs</div>
                    <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Automatically grade multiple choice and true/false questions</div>
                  </div>
                  <Toggle checked={aiAutoGrade} onChange={setAiAutoGrade} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">AI feedback generation</div>
                    <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Generate personalized feedback for each submission</div>
                  </div>
                  <Toggle checked={aiFeedback} onChange={setAiFeedback} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Require teacher review</div>
                    <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>AI suggestions must be approved before publishing grades</div>
                  </div>
                  <Toggle checked={aiReviewRequired} onChange={setAiReviewRequired} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h3 className="text-base font-semibold mb-5">Notification Preferences</h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Submission notifications</div>
                    <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Get notified when a student submits</div>
                  </div>
                  <Toggle checked={notifySubmission} onChange={setNotifySubmission} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Deadline reminders</div>
                    <div className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Remind students before the deadline</div>
                  </div>
                  <Toggle checked={notifyDeadline} onChange={setNotifyDeadline} />
                </div>
                {notifyDeadline && (
                  <div className="max-w-xs">
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Reminder hours before deadline</label>
                    <input type="number" min={1} value={reminderHours} onChange={e => setReminderHours(parseInt(e.target.value) || 24)} className={inputClass} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'export' && (
            <div>
              <h3 className="text-base font-semibold mb-5">Export Preferences</h3>
              <div className="space-y-5">
                <div className="max-w-xs">
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>Default export format</label>
                  <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className={inputClass}>
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rubrics' && (
            <div>
              <h3 className="text-base font-semibold mb-5">Rubric Templates</h3>
              <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                <Layers size={32} className={`mx-auto mb-3 ${isDark ? 'text-white/15' : 'text-black/15'}`} />
                <p className={`text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>No rubric templates created yet. Create reusable rubrics to speed up assessment setup.</p>
              </div>
            </div>
          )}

          {activeSection === 'questionbank' && (
            <div>
              <h3 className="text-base font-semibold mb-5">Question Banks</h3>
              <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                <BookMarked size={32} className={`mx-auto mb-3 ${isDark ? 'text-white/15' : 'text-black/15'}`} />
                <p className={`text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>No question banks created yet. Organize saved questions by topic for quick reuse.</p>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className={`mt-6 pt-4 border-t flex justify-end ${isDark ? 'border-white/5' : 'border-black/5'}`}>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
              <Save size={16} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
