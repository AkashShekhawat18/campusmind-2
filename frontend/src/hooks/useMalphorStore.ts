'use client';

import { create } from 'zustand';

// ── Base States ──────────────────────────────────────────────
// Only one active at a time. Describes what Malphor is *doing*.
export type MalphorBaseState =
  | 'idle'
  | 'walking'
  | 'talking'
  | 'thinking'
  | 'sleep';

// ── Gestures ─────────────────────────────────────────────────
// Short one-shot bursts layered on top of the base state.
export type GestureType = 'hop' | 'flick' | 'stretch' | 'nod' | null;

// ── Store ────────────────────────────────────────────────────
interface MalphorStore {
  // Base animation state
  baseState: MalphorBaseState;
  prevBaseState: MalphorBaseState;

  // Gesture overlay
  gesture: GestureType;
  gestureStartTime: number; // performance.now() when gesture fired

  // Talking cadence (0–1, driven by chars-per-second of streaming text)
  talkingIntensity: number;

  // Cinematic / Behavioral Flags
  chatOpen: boolean;

  // Actions
  setBaseState: (s: MalphorBaseState) => void;
  fireGesture: (g: GestureType) => void;
  clearGesture: () => void;
  setTalkingIntensity: (v: number) => void;
  setChatOpen: (v: boolean) => void;
}

export const useMalphorStore = create<MalphorStore>((set, get) => ({
  baseState: 'idle',
  prevBaseState: 'idle',

  gesture: null,
  gestureStartTime: 0,

  talkingIntensity: 0.5,

  chatOpen: false,

  setBaseState: (s) =>
    set((state) => ({
      prevBaseState: state.baseState,
      baseState: s,
    })),

  fireGesture: (g) =>
    set({
      gesture: g,
      gestureStartTime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    }),

  clearGesture: () => set({ gesture: null }),

  setTalkingIntensity: (v) => set({ talkingIntensity: Math.max(0, Math.min(1, v)) }),

  setChatOpen: (v) => set({ chatOpen: v }),
}));
