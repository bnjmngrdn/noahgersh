"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  Credit,
  InspirationItem,
  ListenLink,
  Project,
  Track,
} from "../_data";
import type { LibraryItem } from "../../library/_data";
import { useAudioPlayback } from "../../_components/audio-playback-provider";

const CONTENT_CONTAINER =
  "mx-auto w-full max-w-[900px] px-8";

function formatTrackDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
        <span className="absolute left-8 top-3 tabular-nums text-black/60">
          {project.year}
        </span>
        <div className={CONTENT_CONTAINER}>
          <div className="grid grid-cols-[150px_minmax(0,1fr)] items-baseline gap-x-6">
            <span className="min-w-0 font-medium uppercase tracking-[0.02em]">
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
              {project.modules.showListen && (
                <ListenSection links={project.listen} />
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

function ArtworkSection({ src, alt }: { src: string; alt: string }) {
  return (
    <section>
      <SectionLabel>ARTWORK</SectionLabel>
      <div className="relative aspect-square w-[260px] overflow-hidden bg-black/5">
        <Image src={src} alt={alt} fill className="object-cover" sizes="260px" />
      </div>
    </section>
  );
}

function ArtworkPlaceholder({ title }: { title: string }) {
  return (
    <section>
      <SectionLabel>ARTWORK</SectionLabel>
      <div className="flex aspect-square w-[260px] items-center justify-center bg-black/[0.04] text-black/40">
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

function TracklistSection({ tracks }: { tracks: Track[] }) {
  return (
    <section>
      <SectionLabel>TRACKLIST</SectionLabel>
      <SectionRule />
      <ul className="pt-2">
        {tracks.map((t, i) => (
          <TracklistRow
            key={`${i}-${t.num}-${t.title}`}
            track={t}
          />
        ))}
      </ul>
    </section>
  );
}

function TracklistRow({ track: t }: { track: Track }) {
  const { currentSrc, isPlaying, toggleSource } = useAudioPlayback();
  const [durationFromFile, setDurationFromFile] = useState<string | null>(
    null,
  );
  const durationDisplay =
    t.duration?.trim() || durationFromFile?.trim() || "\u2014";
  const url = t.audioUrl?.trim() ?? "";
  const canPlay = Boolean(url);
  const isActive = canPlay && currentSrc === url;
  const playing = isActive && isPlaying;

  useEffect(() => {
    if (t.duration?.trim() || !url) return;
    let cancelled = false;
    const a = new Audio();
    a.preload = "metadata";
    a.src = url;
    a.onloadedmetadata = () => {
      if (cancelled) return;
      const formatted = formatTrackDuration(a.duration);
      if (formatted) setDurationFromFile(formatted);
    };
    return () => {
      cancelled = true;
      a.src = "";
    };
  }, [t.duration, url]);

  return (
    <li className="flex items-baseline gap-6 py-2">
      <button
        type="button"
        disabled={!canPlay}
        onClick={() => canPlay && toggleSource(url)}
        aria-label={playing ? "Pause" : "Play"}
        className="w-10 shrink-0 text-left text-[11px] font-normal uppercase tracking-[0.05em] text-black/60 tabular-nums transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-35"
      >
        {playing ? "PAUSE" : "PLAY"}
      </button>
      <span className="min-w-0 flex-1 font-medium uppercase tracking-[0.02em] text-black">
        {t.title}
      </span>
      <span className="shrink-0 tabular-nums text-black/60">{durationDisplay}</span>
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
            className="grid grid-cols-[160px_minmax(0,1fr)] items-baseline gap-x-6 py-1.5"
          >
            <span className="font-medium">{c.name}</span>
            <span className="text-black/50">{c.roles}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ListenSection({ links }: { links: ListenLink[] }) {
  return (
    <section>
      <SectionLabel>LISTEN</SectionLabel>
      <SectionRule />
      <ul className="pt-2">
        {links.map((l) => (
          <li key={l.label} className="py-0.5 font-medium">
            {l.href ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black/60 transition-colors"
              >
                {l.label}
              </a>
            ) : (
              l.label
            )}
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
        <Image
          src={item.src}
          alt={item.alt ?? item.title}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 220px, 33vw"
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
  return (
    <section>
      <SectionLabel>INSPIRATION</SectionLabel>
      <SectionRule />
      <div className="grid grid-cols-3 gap-x-4 pt-4">
        {items.map((insp) => {
          const lib = libraryItems.find((l) => l.id === insp.libraryItemId);
          if (!lib) return null;
          return (
            <Link
              key={insp.libraryItemId}
              href={`/library?open=${encodeURIComponent(insp.libraryItemId)}`}
              className="block transition-opacity hover:opacity-80"
            >
              <InspirationLibraryThumb item={lib} />
              <div className="text-[11px] tracking-[0.02em] text-black/60">
                {lib.title}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
