'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative bg-background pt-32 pb-8 overflow-hidden z-20">
      <div className="container mx-auto px-6 relative z-10">
        
        {/* Giant Typography */}
        <div className="w-full flex justify-center items-center relative overflow-visible py-8">
          <h1 
            className="text-[11vw] font-bold tracking-tighter leading-none text-foreground w-full text-center select-none bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent"
          >
            MALPHOR
          </h1>
        </div>
        
        {/* Bottom Footer */}
        <div className="mt-16 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-medium pt-8 border-t border-foreground/5">
          <p className="mb-4 md:mb-0">© {new Date().getFullYear()} MALPHOR Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
