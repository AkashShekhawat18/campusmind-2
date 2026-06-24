'use client';

import { useRef, useCallback } from 'react';

// =============================================================================
// **TODO: DROP YOUR AUDIO FILES IN THE `public/audio/` DIRECTORY**
//
// Place your .mp3 / .wav / .ogg files inside:
//   frontend/public/audio/
//
// Then update the paths below to match your filenames.
// The paths are relative to the `public/` folder (Next.js serves them at root).
// =============================================================================

// **TODO: DROP AUDIO HERE — Update these file paths once your audio files are ready**
//
// - Single string  = plays the same clip every time
// - Array of strings = cycles through clips in round-robin order per click
//
const AUDIO_PATHS: Record<string, string | string[]> = {
  // **TODO: Add more files to this array to cycle through on each TRY NOW click**
  tryNow: [
    '/audio/try-now.mp3',
    '/audio/try-2.mp3',
    // '/audio/try-3.mp3',
  ],
  getStarted:  '/audio/get-started.mp3',   // **TODO: Replace with your actual GET STARTED audio file**
  adminPortal: '/audio/admin-portal.mp3',  // **TODO: Replace with your actual ADMIN PORTAL audio file**
};

export type AudioKey = keyof typeof AUDIO_PATHS;

/**
 * useAudioManager — Centralized audio playback hook.
 *
 * Features:
 * - Supports SINGLE path (string) or MULTIPLE paths (string[]) per key.
 * - Round-robin cycling: each call to playAudio('tryNow') advances to the next clip.
 * - Prevents audio overlap: stops current audio before playing a new one.
 * - Graceful fallback: catches 404 / missing file errors without crashing.
 *
 * Usage:
 *   const { playAudio } = useAudioManager();
 *   <button onClick={() => playAudio('tryNow')}>TRY NOW</button>
 */
export function useAudioManager() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((key: AudioKey) => {
    const pathOrPaths = AUDIO_PATHS[key];
    if (!pathOrPaths) return;

    // Resolve which file to play
    let filePath: string;

    if (Array.isArray(pathOrPaths)) {
      // --- Round-Robin Logic (persisted across page reloads via localStorage) ---
      const storageKey = `campusmind_audio_index_${key}`;
      const currentIndex = parseInt(localStorage.getItem(storageKey) ?? '0', 10) % pathOrPaths.length;
      filePath = pathOrPaths[currentIndex];

      // Advance index for next play, wrapping back to 0 at the end of the array
      localStorage.setItem(storageKey, String((currentIndex + 1) % pathOrPaths.length));
    } else {
      // Single path — same clip every time
      filePath = pathOrPaths;
    }

    // Stop any currently playing audio to prevent overlap
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Create a fresh Audio instance (avoids stale src issues)
    const audio = new Audio(filePath);
    audioRef.current = audio;

    // Attempt playback with graceful fallback for missing files
    audio.play().catch(() => {
      // **Graceful Fallback**: File is missing or failed to load — no crash, just a warning
      console.warn(`🔇 Audio file pending: "${filePath}" — Place your audio file in public/audio/`);
    });
  }, []);

  return { playAudio };
}
