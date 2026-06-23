'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative bg-graphite pt-32 pb-8 overflow-hidden z-20">
      <div className="container mx-auto px-6 relative z-10">
        
        {/* Giant Typography */}
        <div className="w-full flex justify-center items-center relative overflow-visible py-8">
          <h1 
            className="text-[11vw] font-bold tracking-tighter leading-none text-white w-full text-center select-none"
            style={{ 
              background: 'linear-gradient(to bottom, #ffffff 30%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            CampusMind
          </h1>
        </div>
        
        {/* Bottom Footer */}
        <div className="mt-16 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-medium pt-8 border-t border-white/5">
          <p className="mb-4 md:mb-0">© {new Date().getFullYear()} CampusMind Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
