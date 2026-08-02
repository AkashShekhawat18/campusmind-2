'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, FileText, MoreVertical, Edit3, Trash2, Copy, Eye } from 'lucide-react';
import { StatusBadge, type Status } from './StatusBadge';

export interface AssessmentData {
  id: string;
  title: string;
  type: 'quiz' | 'test' | 'assignment' | 'homework' | 'lab' | 'coding';
  status: Status;
  subject?: string;
  questionCount: number;
  totalMarks: number;
  dueDate?: string;
  assignedTo?: string;
  submissionCount?: number;
  totalStudents?: number;
  averageScore?: number;
  createdAt: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  quiz:       { label: 'Quiz',       color: 'from-violet-500 to-purple-400' },
  test:       { label: 'Test',       color: 'from-blue-500 to-cyan-400' },
  assignment: { label: 'Assignment', color: 'from-emerald-500 to-green-400' },
  homework:   { label: 'Homework',   color: 'from-amber-500 to-yellow-400' },
  lab:        { label: 'Lab',        color: 'from-pink-500 to-rose-400' },
  coding:     { label: 'Coding',     color: 'from-orange-500 to-red-400' },
};

interface AssessmentCardProps {
  assessment: AssessmentData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onView?: (id: string) => void;
}

export function AssessmentCard({ assessment, onEdit, onDelete, onDuplicate, onView }: AssessmentCardProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const typeInfo = typeLabels[assessment.type] || typeLabels.quiz;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative rounded-2xl p-5 transition-all ${
        isDark
          ? 'bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
          : 'bg-white border border-black/5 hover:border-black/10 hover:shadow-lg'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${typeInfo.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{assessment.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'
              }`}>
                {typeInfo.label}
              </span>
              <StatusBadge status={assessment.status} />
            </div>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <MoreVertical size={16} className="opacity-50" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className={`absolute right-0 top-8 z-20 w-40 rounded-xl p-1.5 shadow-xl border ${
                isDark ? 'bg-[#1a1a1e] border-white/10' : 'bg-white border-black/10'
              }`}>
                {onView && (
                  <button onClick={() => { onView(assessment.id); setMenuOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                    <Eye size={14} /> View
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => { onEdit(assessment.id); setMenuOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                    <Edit3 size={14} /> Edit
                  </button>
                )}
                {onDuplicate && (
                  <button onClick={() => { onDuplicate(assessment.id); setMenuOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                    <Copy size={14} /> Duplicate
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => { onDelete(assessment.id); setMenuOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-400 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
        <span className="flex items-center gap-1">
          <FileText size={12} /> {assessment.questionCount} questions
        </span>
        <span className="flex items-center gap-1">
          <span className="font-medium">{assessment.totalMarks}</span> marks
        </span>
        {assessment.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {assessment.dueDate}
          </span>
        )}
        {assessment.assignedTo && (
          <span className="flex items-center gap-1">
            <Users size={12} /> {assessment.assignedTo}
          </span>
        )}
      </div>

      {/* Submission progress (for active/completed) */}
      {assessment.submissionCount !== undefined && assessment.totalStudents !== undefined && assessment.totalStudents > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className={isDark ? 'text-white/40' : 'text-black/40'}>Submissions</span>
            <span className={isDark ? 'text-white/60' : 'text-black/60'}>{assessment.submissionCount}/{assessment.totalStudents}</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${(assessment.submissionCount / assessment.totalStudents) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
