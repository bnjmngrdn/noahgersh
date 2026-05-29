"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AudioQueueItem = {
  src: string;
  title: string;
};

export type AudioPlaybackContextValue = {
  /** Active source URL, or last-selected track while the element still points at it */
  currentSrc: string | null;
  currentTitle: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasNext: boolean;
  hasPrevious: boolean;
  /** Play this URL, or pause if it is already playing */
  toggleSource: (src: string, queue?: AudioQueueItem[]) => void;
  /** Seek to `time` (seconds) on this URL; starts playback if needed */
  seekSource: (src: string, time: number, queue?: AudioQueueItem[]) => void;
  pause: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
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

function queueForSrc(
  src: string,
  nextQueue: AudioQueueItem[] | undefined,
  existingQueue: AudioQueueItem[],
): AudioQueueItem[] {
  if (nextQueue?.length) return nextQueue;
  if (existingQueue.some((item) => item.src === src)) return existingQueue;
  return [{ src, title: "" }];
}

export function AudioPlaybackProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSrcRef = useRef<string | null>(null);
  const queueRef = useRef<AudioQueueItem[]>([]);
  const pendingSeekRef = useRef<number | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const syncPlaybackState = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setDuration(Number.isFinite(el.duration) ? el.duration : 0);
  }, []);

  const updateQueue = useCallback((nextQueue: AudioQueueItem[]) => {
    queueRef.current = nextQueue;
    setQueue(nextQueue);
  }, []);

  const playFrom = useCallback(
    (src: string, time: number, nextQueue?: AudioQueueItem[]) => {
      const el = audioRef.current;
      if (!el) return;

      const resolvedQueue = queueForSrc(src, nextQueue, queueRef.current);
      updateQueue(resolvedQueue);

      const startAt = Math.max(0, time);

      if (currentSrcRef.current === src) {
        el.currentTime = startAt;
        void el.play().catch(() => {});
        return;
      }

      currentSrcRef.current = src;
      setCurrentSrc(src);
      pendingSeekRef.current = startAt;
      el.src = src;
      if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
        el.currentTime = startAt;
        pendingSeekRef.current = null;
      }
      void el.play().catch(() => {});
    },
    [updateQueue],
  );

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      syncPlaybackState();

      const current = currentSrcRef.current;
      const activeQueue = queueRef.current;
      if (!current || activeQueue.length === 0) return;

      const index = activeQueue.findIndex((item) => item.src === current);
      if (index === -1 || index >= activeQueue.length - 1) return;

      playFrom(activeQueue[index + 1].src, 0);
    };
    const onTimeUpdate = () => syncPlaybackState();
    const onLoadedMetadata = () => {
      if (pendingSeekRef.current !== null) {
        el.currentTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
      }
      syncPlaybackState();
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("durationchange", onLoadedMetadata);
    el.addEventListener("seeked", onTimeUpdate);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("durationchange", onLoadedMetadata);
      el.removeEventListener("seeked", onTimeUpdate);
    };
  }, [syncPlaybackState, playFrom]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggleSource = useCallback(
    (src: string, nextQueue?: AudioQueueItem[]) => {
      const el = audioRef.current;
      if (!el) return;

      if (currentSrcRef.current === src) {
        if (el.paused) {
          if (nextQueue?.length) updateQueue(nextQueue);
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
        return;
      }

      playFrom(src, 0, nextQueue);
    },
    [playFrom, updateQueue],
  );

  const seekSource = useCallback(
    (src: string, time: number, nextQueue?: AudioQueueItem[]) => {
      playFrom(src, time, nextQueue);
    },
    [playFrom],
  );

  const skipToNext = useCallback(() => {
    const current = currentSrcRef.current;
    const activeQueue = queueRef.current;
    if (!current || activeQueue.length === 0) return;

    const index = activeQueue.findIndex((item) => item.src === current);
    if (index === -1 || index >= activeQueue.length - 1) return;

    playFrom(activeQueue[index + 1].src, 0);
  }, [playFrom]);

  const skipToPrevious = useCallback(() => {
    const el = audioRef.current;
    const current = currentSrcRef.current;
    if (!el || !current) return;

    if (el.currentTime > 3) {
      el.currentTime = 0;
      syncPlaybackState();
      return;
    }

    const activeQueue = queueRef.current;
    const index = activeQueue.findIndex((item) => item.src === current);
    if (index > 0) {
      playFrom(activeQueue[index - 1].src, 0);
      return;
    }

    el.currentTime = 0;
    syncPlaybackState();
  }, [playFrom, syncPlaybackState]);

  const currentIndex = useMemo(
    () =>
      currentSrc
        ? queue.findIndex((item) => item.src === currentSrc)
        : -1,
    [currentSrc, queue],
  );

  const currentTitle =
    currentIndex >= 0 ? queue[currentIndex]?.title || null : null;

  const hasNext =
    currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrevious =
    currentIndex > 0 || currentTime > 3;

  const value: AudioPlaybackContextValue = {
    currentSrc,
    currentTitle,
    isPlaying,
    currentTime,
    duration,
    hasNext,
    hasPrevious,
    toggleSource,
    seekSource,
    pause,
    skipToNext,
    skipToPrevious,
  };

  return (
    <AudioPlaybackContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="auto" className="hidden" />
    </AudioPlaybackContext.Provider>
  );
}
