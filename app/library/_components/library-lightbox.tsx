"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import OptimizedImage from "../../_components/optimized-image";
import { useLibrarySearch } from "../../_components/library-search";
import { LIGHTBOX_WIDTH } from "@/lib/sanity/image";
import type { LibraryItem } from "../_data";
import { youtubeEmbedUrl } from "@/lib/youtube";

const EASE = "ease-in-out";
const DURATION_MS = 360;

type Props = {
  item: LibraryItem | null;
  onClose: () => void;
};

function subscribePrefersReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getPrefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function LibraryLightbox({ item, onClose }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const hadItemRef = useRef(false);

  const [displayItem, setDisplayItem] = useState<LibraryItem | null>(null);
  const [visible, setVisible] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const reduceMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    () => false,
  );
  /* eslint-disable react-hooks/set-state-in-effect -- transition state machine */
  useEffect(() => {
    if (item) {
      setDisplayItem(item);
      if (reduceMotion) {
        setVisible(true);
        hadItemRef.current = true;
        return;
      }

      const openingFromClosed = !hadItemRef.current;
      hadItemRef.current = true;

      if (openingFromClosed) {
        setVisible(false);
        const id = requestAnimationFrame(() => {
          setVisible(true);
        });
        return () => cancelAnimationFrame(id);
      }

      setVisible(true);
      return;
    }

    hadItemRef.current = false;

    if (reduceMotion) {
      setVisible(false);
      setDisplayItem(null);
      return;
    }

    setVisible(false);
    const exitTimer = window.setTimeout(() => {
      setDisplayItem(null);
    }, DURATION_MS);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [item, reduceMotion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!displayItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [displayItem]);

  useEffect(() => {
    const listen = item !== null || displayItem !== null;
    if (!listen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, displayItem, onClose]);

  useEffect(() => {
    if (visible && displayItem) {
      closeBtnRef.current?.focus({ preventScroll: true });
    }
  }, [visible, displayItem]);

  if (!displayItem || !mounted) return null;

  const duration = reduceMotion ? 0 : DURATION_MS;
  const transitionStyle = {
    transitionProperty: "opacity, transform",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: duration ? EASE : "linear",
  } as const;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-8 sm:py-13"
      role="dialog"
      aria-modal="true"
      aria-label={displayItem.title}
      data-library-lightbox=""
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-lg"
        style={{
          ...transitionStyle,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
        aria-label="Close lightbox"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-[900px] flex-col overflow-y-auto border border-black/15 bg-white will-change-[opacity,transform]"
        style={{
          ...transitionStyle,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <div className="flex justify-end px-4 py-3 sm:px-8">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="shrink-0 text-[11px] font-medium text-black/30 transition-colors hover:text-black/60"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-14 px-4 pb-13 pt-0 sm:px-8">
          {displayItem.type === "image" && (
            <OptimizedImage
              source={displayItem.imageSource}
              src={displayItem.src}
              alt={displayItem.alt ?? displayItem.title}
              width={1200}
              height={1200}
              className="mx-auto block max-h-[min(55vh,560px)] w-auto max-w-full"
              sizes="(min-width: 900px) 900px, 100vw"
              defaultWidth={LIGHTBOX_WIDTH}
            />
          )}
          {displayItem.type === "video" && (
            <video
              key={displayItem.src}
              src={displayItem.src}
              controls
              playsInline
              className="mx-auto block max-h-[min(55vh,560px)] w-auto max-w-full"
              preload="metadata"
            />
          )}
          {displayItem.type === "audio" && (
            <audio
              key={displayItem.src}
              src={displayItem.src}
              controls
              preload="metadata"
              className="w-full"
            />
          )}
          {displayItem.type === "youtube" && (
            <div className="relative aspect-video w-full">
              <iframe
                src={youtubeEmbedUrl(displayItem.videoId)}
                title={displayItem.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          )}

          <section>
            <div className="pb-2 text-[11px] font-medium uppercase tracking-[0.02em] text-black/50">
              DESCRIPTION
            </div>
            <div className="h-px bg-black/15" />
            <div className="space-y-4 pt-4">
              <p className="text-black/80">{displayItem.description}</p>
            </div>
          </section>

          <section>
            <div className="pb-2 text-[11px] font-medium uppercase tracking-[0.02em] text-black/50">
              TAGS
            </div>
            <div className="h-px bg-black/15" />
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-4">
              {displayItem.tags.map((tag) => (
                <li key={tag}>
                  <LibraryTagButton tag={tag} onClose={onClose} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function LibraryTagButton({
  tag,
  onClose,
}: {
  tag: string;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { applySearch } = useLibrarySearch();

  return (
    <button
      type="button"
      onClick={() => {
        onClose();
        if (pathname.startsWith("/library")) {
          applySearch(tag);
          return;
        }
        router.push(`/library?q=${encodeURIComponent(tag)}`);
      }}
      className="text-black/60 transition-colors hover:text-black"
    >
      {tag}
    </button>
  );
}
