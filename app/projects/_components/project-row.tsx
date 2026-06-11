"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import OptimizedImage from "../../_components/optimized-image";
import { THUMB_WIDTHS, type SanityImageInput } from "@/lib/sanity/image";
import type {
  Credit,
  InspirationItem,
  Project,
  Track,
} from "../_data";
import type { LibraryItem } from "../../library/_data";
import LibraryLightbox from "../../library/_components/library-lightbox";
import { useAudioPlayback, type AudioQueueItem } from "../../_components/audio-playback-provider";
import { youtubeThumbnailUrl } from "@/lib/youtube";

const CONTENT_CONTAINER =
  "mx-auto w-full max-w-[900px] px-4 sm:px-8";

function formatTrackDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Parse track duration labels like "4:00" or "1:05" to seconds. */
function parseDurationLabelToSeconds(label: string): number | null {
  const t = label.trim();
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length === 2) {
    const m = Number.parseInt(parts[0], 10);
    const s = Number.parseInt(parts[1], 10);
    if (Number.isFinite(m) && Number.isFinite(s)) return m * 60 + s;
  }
  return null;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}

function TrackPlayhead({
  progress,
  disabled,
  onSeek,
}: {
  progress: number;
  disabled: boolean;
  onSeek: (ratio: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar || disabled) return;
      const rect = bar.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onSeek(ratio);
    },
    [disabled, onSeek],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      seekFromClientX(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [seekFromClientX]);

  const pct = Math.min(100, Math.max(0, progress * 100));

  return (
    <div
      ref={barRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`relative flex min-h-1 flex-1 items-center py-1 ${
        disabled ? "pointer-events-none opacity-35" : "cursor-pointer"
      }`}
      onPointerDown={(e) => {
        if (disabled) return;
        draggingRef.current = true;
        seekFromClientX(e.clientX);
      }}
      onClick={(e) => seekFromClientX(e.clientX)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.02));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.02));
      }}
    >
      <div className="relative h-1 w-full bg-[#EEE]">
        <div
          className="absolute inset-y-0 left-0 bg-[#CCC]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProjectRow({
  project,
  libraryItems,
}: {
  project: Project;
  libraryItems: LibraryItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="border-t border-black/15 last:border-b">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative block w-full py-3 text-left"
      >
        <span className="pointer-events-none absolute left-4 top-3 hidden tabular-nums text-black/60 sm:left-8 md:block">
          {project.year}
        </span>
        <div className={CONTENT_CONTAINER}>
          <div className="flex flex-col gap-1 md:hidden">
            <span className="tabular-nums text-[11px] text-black/60">
              {project.year}
            </span>
            <span className="min-w-0 font-medium uppercase tracking-[0.02em]">
              {project.artist}
            </span>
            <span className="min-w-0 font-medium uppercase tracking-[0.02em]">
              &ldquo;{project.title}&rdquo;
            </span>
          </div>
          <div className="hidden md:grid md:grid-cols-[20rem_minmax(0,1fr)] md:items-baseline md:gap-x-6">
            <span className="whitespace-nowrap font-medium uppercase tracking-[0.02em]">
              {project.artist}
            </span>
            <span className="min-w-0 font-medium uppercase tracking-[0.02em]">
              &ldquo;{project.title}&rdquo;
            </span>
          </div>
        </div>
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-[360ms] ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`${CONTENT_CONTAINER} pb-13 transition-[opacity,transform] duration-[360ms] ease-in-out will-change-[opacity,transform] ${
              open
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="space-y-14 pt-6">
              {project.modules.showArtwork &&
                (project.artwork ? (
                  <ArtworkSection
                    src={project.artwork.src}
                    alt={project.artwork.alt}
                    imageSource={project.artwork.imageSource}
                  />
                ) : (
                  <ArtworkPlaceholder title={project.title} />
                ))}
              {project.modules.showAbout && (
                <AboutSection paragraphs={project.about} />
              )}
              {project.modules.showTracklist && (
                <TracklistSection tracks={project.tracklist} />
              )}
              {project.modules.showCredits && (
                <CreditsSection credits={project.credits} />
              )}
              {project.modules.showInspiration && (
                <InspirationSection
                  items={project.inspiration}
                  libraryItems={libraryItems}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2 text-[11px] italic text-black/50">{children}</div>
  );
}

function SectionRule() {
  return <div className="h-px bg-black/15" />;
}

function ArtworkSection({
  src,
  alt,
  imageSource,
}: {
  src: string;
  alt: string;
  imageSource?: SanityImageInput;
}) {
  return (
    <section>
      <SectionLabel>ARTWORK</SectionLabel>
      <div className="relative aspect-square w-full max-w-[260px] overflow-hidden bg-black/5">
        <OptimizedImage
          source={imageSource}
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 380px) 100vw, 260px"
          widths={THUMB_WIDTHS}
          defaultWidth={520}
        />
      </div>
    </section>
  );
}

function ArtworkPlaceholder({ title }: { title: string }) {
  return (
    <section>
      <SectionLabel>ARTWORK</SectionLabel>
      <div className="flex aspect-square w-full max-w-[260px] items-center justify-center bg-black/[0.04] text-black/40">
        <span className="text-[11px] tracking-[0.05em]">{title}</span>
      </div>
    </section>
  );
}

function AboutSection({ paragraphs }: { paragraphs: string[] }) {
  return (
    <section>
      <SectionLabel>ABOUT</SectionLabel>
      <SectionRule />
      <div className="space-y-4 pt-4">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

function trackPlaylist(tracks: Track[]): AudioQueueItem[] {
  return tracks.flatMap((track) => {
    const src = track.audioUrl?.trim() ?? "";
    if (!src) return [];
    return [{ src, title: track.title }];
  });
}

function TracklistSection({ tracks }: { tracks: Track[] }) {
  const playlist = trackPlaylist(tracks);

  return (
    <section>
      <SectionLabel>TRACKLIST</SectionLabel>
      <SectionRule />
      <ul className="pt-2">
        {tracks.map((t, i) => (
          <TracklistRow
            key={`${i}-${t.num}-${t.title}`}
            track={t}
            playlist={playlist}
          />
        ))}
      </ul>
    </section>
  );
}

function TracklistRow({
  track: t,
  playlist,
}: {
  track: Track;
  playlist: AudioQueueItem[];
}) {
  const {
    currentSrc,
    isPlaying,
    currentTime,
    duration: activeDuration,
    toggleSource,
    seekSource,
  } = useAudioPlayback();
  const [durationFromFile, setDurationFromFile] = useState<number | null>(null);

  const url = t.audioUrl?.trim() ?? "";
  const canPlay = Boolean(url);
  const isActive = canPlay && currentSrc === url;

  const labelDurationSeconds = parseDurationLabelToSeconds(t.duration ?? "");
  const totalDurationSeconds =
    isActive && activeDuration > 0
      ? activeDuration
      : labelDurationSeconds ?? durationFromFile ?? 0;

  const progress =
    isActive && totalDurationSeconds > 0
      ? Math.min(1, currentTime / totalDurationSeconds)
      : 0;

  const timeDisplay = (() => {
    if (isActive && totalDurationSeconds > 0) {
      const remaining = Math.max(0, totalDurationSeconds - currentTime);
      return formatTrackDuration(remaining) || "\u2014";
    }
    if (t.duration?.trim()) return t.duration.trim();
    if (durationFromFile !== null) {
      return formatTrackDuration(durationFromFile) || "\u2014";
    }
    return "\u2014";
  })();

  const playing = isActive && isPlaying;

  useEffect(() => {
    if (labelDurationSeconds || !url) return;
    let cancelled = false;
    const a = new Audio();
    a.preload = "metadata";
    a.src = url;
    a.onloadedmetadata = () => {
      if (cancelled) return;
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setDurationFromFile(a.duration);
      }
    };
    return () => {
      cancelled = true;
      a.src = "";
    };
  }, [labelDurationSeconds, url]);

  const handleSeek = useCallback(
    (ratio: number) => {
      if (!canPlay || !totalDurationSeconds) return;
      seekSource(url, ratio * totalDurationSeconds, playlist);
    },
    [canPlay, totalDurationSeconds, playlist, seekSource, url],
  );

  return (
    <li className="grid grid-cols-[1rem_minmax(0,9rem)_minmax(0,1fr)_2.5rem] items-center gap-x-3 py-2 sm:grid-cols-[1rem_13rem_minmax(0,1fr)_2.75rem] sm:gap-x-4">
      <button
        type="button"
        disabled={!canPlay}
        onClick={() => canPlay && toggleSource(url, playlist)}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-4 w-4 shrink-0 items-center justify-center text-black/60 transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-35"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className="truncate font-medium uppercase tracking-[0.02em] text-black">
        {t.title}
      </span>
      <TrackPlayhead
        progress={progress}
        disabled={!canPlay || !totalDurationSeconds}
        onSeek={handleSeek}
      />
      <span className="text-right tabular-nums text-black/60">{timeDisplay}</span>
    </li>
  );
}

function CreditsSection({ credits }: { credits: Credit[] }) {
  return (
    <section>
      <SectionLabel>CREDITS</SectionLabel>
      <SectionRule />
      <ul className="pt-2">
        {credits.map((c) => (
          <li
            key={c.name}
            className="grid grid-cols-1 gap-y-0.5 py-1.5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-baseline sm:gap-x-6 sm:gap-y-0"
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-black/50">{c.roles}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function InspirationLibraryThumb({ item }: { item: LibraryItem }) {
  if (item.type === "image") {
    return (
      <div className="relative mb-2 aspect-video w-full overflow-hidden bg-black/[0.04]">
        <OptimizedImage
          source={item.imageSource}
          src={item.src}
          alt={item.alt ?? item.title}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 220px, 33vw"
          widths={THUMB_WIDTHS}
          defaultWidth={640}
        />
      </div>
    );
  }
  if (item.type === "video") {
    return (
      <div className="relative mb-2 aspect-video w-full overflow-hidden bg-black/[0.04]">
        <video
          src={item.src}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  if (item.type === "youtube") {
    return (
      <div className="relative mb-2 aspect-video w-full overflow-hidden bg-black/[0.04]">
        <Image
          src={youtubeThumbnailUrl(item.videoId)}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 220px, 33vw"
        />
      </div>
    );
  }
  return (
    <div className="mb-2 flex aspect-video w-full items-center justify-center bg-black/[0.04] px-4">
      <span className="text-center text-[11px] tracking-[0.02em] text-black/50">
        {item.title}
      </span>
    </div>
  );
}

function InspirationSection({
  items,
  libraryItems,
}: {
  items: InspirationItem[];
  libraryItems: LibraryItem[];
}) {
  const [lightboxItem, setLightboxItem] = useState<LibraryItem | null>(null);

  return (
    <>
      <section>
        <SectionLabel>INSPIRATION</SectionLabel>
        <SectionRule />
        <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2 sm:gap-x-4 md:grid-cols-3">
          {items.map((insp) => {
            const lib = libraryItems.find((l) => l.id === insp.libraryItemId);
            if (!lib) return null;
            return (
              <button
                key={insp.libraryItemId}
                type="button"
                onClick={() => setLightboxItem(lib)}
                className="block w-full cursor-pointer text-left transition-opacity hover:opacity-80"
              >
                <InspirationLibraryThumb item={lib} />
                <div className="text-[11px] tracking-[0.02em] text-black/60">
                  {lib.title}
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <LibraryLightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
      />
    </>
  );
}
