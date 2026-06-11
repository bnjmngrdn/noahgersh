"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAudioPlayback } from "./audio-playback-provider";

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 18h2V6h-2v12zm-3.5-6L4 6v12l8.5-6z" />
    </svg>
  );
}

function ControlButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center text-black/60 transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ScrollingTitle({ title }: { title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mq.matches);
    updateMotion();
    mq.addEventListener("change", updateMotion);
    return () => mq.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const check = () => {
      setOverflows(measure.scrollWidth > container.clientWidth);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [title]);

  const titleClass =
    "uppercase tracking-[0.02em] text-black/60";

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 overflow-hidden">
      <span
        ref={measureRef}
        className={`pointer-events-none absolute left-0 top-0 opacity-0 ${titleClass} whitespace-nowrap`}
        aria-hidden
      >
        {title}
      </span>
      {overflows && !reducedMotion ? (
        <span className={`mini-player-title-scroll inline-block whitespace-nowrap ${titleClass}`}>
          {title}
          <span aria-hidden>{" \u00a0\u00a0 "}</span>
          {title}
        </span>
      ) : (
        <span className={`block truncate ${titleClass}`}>{title}</span>
      )}
    </div>
  );
}

export default function MiniAudioPlayer({ hideTitle = false }: { hideTitle?: boolean }) {
  const {
    currentSrc,
    currentTitle,
    isPlaying,
    hasNext,
    toggleSource,
    skipToNext,
    skipToPrevious,
  } = useAudioPlayback();

  if (!currentSrc) return null;

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2 border-l border-black/15 pl-3"
      aria-label="Now playing"
    >
      <div className="flex shrink-0 items-center gap-1.5">
        <ControlButton label="Previous track" onClick={skipToPrevious}>
          <SkipBackIcon />
        </ControlButton>
        <ControlButton
          label={isPlaying ? "Pause" : "Play"}
          onClick={() => toggleSource(currentSrc)}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </ControlButton>
        <ControlButton
          label="Next track"
          disabled={!hasNext}
          onClick={skipToNext}
        >
          <SkipForwardIcon />
        </ControlButton>
      </div>
      {!hideTitle && currentTitle ? <ScrollingTitle title={currentTitle} /> : null}
    </div>
  );
}
