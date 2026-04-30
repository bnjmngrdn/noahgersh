"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AudioPlaybackContextValue = {
  /** Active source URL, or last-selected track while the element still points at it */
  currentSrc: string | null;
  isPlaying: boolean;
  /** Play this URL, or pause if it is already playing */
  toggleSource: (src: string) => void;
  pause: () => void;
};

const AudioPlaybackContext = createContext<AudioPlaybackContextValue | null>(
  null,
);

export function useAudioPlayback(): AudioPlaybackContextValue {
  const ctx = useContext(AudioPlaybackContext);
  if (!ctx) {
    throw new Error(
      "useAudioPlayback must be used within AudioPlaybackProvider",
    );
  }
  return ctx;
}

export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSrcRef = useRef<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggleSource = useCallback((src: string) => {
    const el = audioRef.current;
    if (!el) return;

    if (currentSrcRef.current === src) {
      if (el.paused) {
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
      return;
    }

    currentSrcRef.current = src;
    setCurrentSrc(src);
    el.src = src;
    void el.play().catch(() => {});
  }, []);

  const value: AudioPlaybackContextValue = {
    currentSrc,
    isPlaying,
    toggleSource,
    pause,
  };

  return (
    <AudioPlaybackContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="auto" className="hidden" />
    </AudioPlaybackContext.Provider>
  );
}
