'use client';

import { useState, useEffect, useRef } from 'react';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useSafeZones() {
  const [safeZones, setSafeZones] = useState<BoundingBox[]>([]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computeZones = () => {
      // Find elements that Malphor should avoid
      // Navbar, specific CTA buttons by text, forms, etc.
      const selectors = [
        'nav', 
        'form',
        'footer',
        '[role="dialog"]', // modals
        '.support-panel', // Malphor's own chat panel
      ];

      const zones: BoundingBox[] = [];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Add some padding to the exclusion zone
            const padding = 20;
            zones.push({
              x: Math.round(rect.x - padding),
              y: Math.round(rect.y - padding),
              width: Math.round(rect.width + padding * 2),
              height: Math.round(rect.height + padding * 2)
            });
          }
        });
      });

      // Find CTA buttons by text specifically
      const allButtons = document.querySelectorAll('button, a');
      allButtons.forEach(btn => {
        const text = btn.textContent?.trim().toLowerCase() || '';
        if (text.includes('try now') || text.includes('get started') || text.includes('login') || text.includes('sign up')) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            zones.push({
              x: Math.round(rect.x - 20),
              y: Math.round(rect.y - 20),
              width: Math.round(rect.width + 40),
              height: Math.round(rect.height + 40)
            });
          }
        }
      });

      setSafeZones(prev => {
        if (JSON.stringify(prev) === JSON.stringify(zones)) {
          return prev;
        }
        return zones;
      });
    };

    const updateZones = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(computeZones, 150);
    };

    // Initial check
    updateZones();

    // Check on resize and scroll
    window.addEventListener('resize', updateZones);
    // Use a small debounce or interval for DOM mutations if needed, 
    // but resize and scroll are usually sufficient for static-ish sites.
    window.addEventListener('scroll', updateZones, { passive: true });

    const interval = setInterval(updateZones, 2000); // Check every 2s for dynamic DOM changes

    return () => {
      window.removeEventListener('resize', updateZones);
      window.removeEventListener('scroll', updateZones);
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return safeZones;
}
