'use client';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, Lock } from 'lucide-react';

export function AdminShowcaseSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 z-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Admin Control Center</h2>
        <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">Complete oversight and access management without the clutter.</p>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { icon: Shield, title: "User Approval", desc: "Review and verify student and teacher registrations securely." },
          { icon: Lock, title: "Access Management", desc: "Granular role-based permissions for every institutional layer." },
          { icon: Activity, title: "Platform Oversight", desc: "Monitor system health, active sessions, and global usage." },
          { icon: Users, title: "User Monitoring", desc: "Track engagement and resolve access issues instantly." }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col gap-4 hover:bg-white/[0.04] transition-colors cursor-default"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-2 border border-white/10">
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{item.title}</h3>
            <p className="text-gray-400 font-light leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
