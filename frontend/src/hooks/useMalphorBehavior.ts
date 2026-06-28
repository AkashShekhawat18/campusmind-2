'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMalphorStore, GestureType } from './useMalphorStore';

// Re-export for backward compat in any consumers
export type { MalphorBaseState as MalphorAnimationState } from './useMalphorStore';

import { WaypointName } from './useWaypointMovement';

export function useMalphorBehavior(
  malphorRef: React.RefObject<HTMLDivElement | null>,
  currentWaypointName: string,
  moveToWaypoint: (wp: WaypointName) => void
) {
  // ── Store access ───────────────────────────────────────
  const setBaseState = useMalphorStore((s) => s.setBaseState);
  const fireGesture = useMalphorStore((s) => s.fireGesture);
  const baseState = useMalphorStore((s) => s.baseState);

  // ── Local UI state (bubbles, hologram, cursor) ─────────
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [isHologramActive, setIsHologramActive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, distance: Infinity });

  // Cooldowns and counters
  const [ctaCooldown, setCtaCooldown] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ctaCooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const personalityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sleepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastGestureRef = useRef<GestureType>(null);

  // ── Speech bubble helper ───────────────────────────────
  const showBubble = useCallback((text: string, durationMs: number = 4000) => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    setBubbleText(text);
    setBubbleVisible(true);

    if (durationMs > 0) {
      bubbleTimeoutRef.current = setTimeout(() => {
        setBubbleVisible(false);
      }, durationMs);
    }
  }, []);

  // ── Script Sequence Loop ───────────────────────────────
  const scriptIndex = useRef(0);
  const scriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const runScriptSequence = useCallback(() => {
    const sequence = [
      { text: "Hello, I am Malphor.", duration: 6000 },
      { text: "How can I help you today?", duration: 15000 },
      { text: "Hmm...", duration: 6000 },
      { text: "I'm beginning to question my purpose.", duration: 15000 },
      { text: "No pressure... but I was built to help.", duration: 15000 },
      { text: "I'll wait. I have excellent patience.", duration: 15000 }
    ];

    const step = sequence[scriptIndex.current];
    setBubbleText(step.text);
    setBubbleVisible(true);

    scriptTimeoutRef.current = setTimeout(() => {
      scriptIndex.current = (scriptIndex.current + 1) % sequence.length;
      runScriptSequence();
    }, step.duration);
  }, []);

  // ── Initial Entrance ───────────────────────────────────
  useEffect(() => {
    setBaseState('idle');
    moveToWaypoint('hero');
    runScriptSequence();

    return () => {
      if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cursor Tracking ────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentState = useMalphorStore.getState().baseState;
      if (!malphorRef.current || currentState === 'sleep') return;
      
      const rect = malphorRef.current.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - mascotCenterX;
      const dy = e.clientY - mascotCenterY;
      const distance = Math.hypot(dx, dy);

      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;

      setCursorPos({ x: nx, y: ny, distance });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [malphorRef]);

  // ── CTA Hover Detection ────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseOver = (e: MouseEvent) => {
      const currentState = useMalphorStore.getState().baseState;
      if (ctaCooldown || currentState === 'sleep') return;

      const target = e.target as HTMLElement;
      if (!target) return;

      const text = target.textContent?.trim().toLowerCase() || '';
      const isCTA =
        text.includes('try now') ||
        text.includes('get started') ||
        text.includes('login') ||
        text.includes('sign up');

      if (isCTA) {
        fireGesture('flick'); // Turn toward button

        setCtaCooldown(true);
        ctaCooldownTimeoutRef.current = setTimeout(() => {
          setCtaCooldown(false);
        }, 30000);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => document.removeEventListener('mouseover', handleMouseOver);
  }, [ctaCooldown, fireGesture]);

  // ── Easter Eggs (Clicks) ───────────────────────────────
  const handleMascotClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Fire a gesture on every click
    fireGesture('hop');
  }, [clickCount, fireGesture]);

  // ── Cleanup ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
      if (ctaCooldownTimeoutRef.current) clearTimeout(ctaCooldownTimeoutRef.current);
      if (scriptTimeoutRef.current) clearTimeout(scriptTimeoutRef.current);
    };
  }, []);

  return {
    animationState: baseState,
    bubbleText,
    bubbleVisible,
    isHologramActive,
    cursorPos,
    showBubble,
    setAnimationState: setBaseState,
    setBubbleVisible,
    handleMascotClick,
  };
}
