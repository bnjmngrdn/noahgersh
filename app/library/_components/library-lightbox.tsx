"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { LibraryItem } from "../_data";

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
  const reduceMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    () => false,
  );

  /* Open/close animation state — synchronous updates coordinate enter/exit timing. */
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

  if (!displayItem) return null;

  const duration = reduceMotion ? 0 : DURATION_MS;
  const transitionStyle = {
    transitionProperty: "opacity, transform",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: duration ? EASE : "linear",
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-8 sm:py-13"
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-lightbox-title"
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
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-black/15 px-4 py-3 sm:gap-6 sm:px-8">
          <h2
            id="library-lightbox-title"
            className="min-w-0 flex-1 break-words text-[12px] font-medium text-black"
          >
            {displayItem.title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="shrink-0 text-[11px] font-medium text-black/30 transition-colors hover:text-black/60"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-14 px-4 pb-13 pt-6 sm:px-8">
          <div className="w-full overflow-hidden bg-black/[0.04]">
            {displayItem.type === "image" && (
              <div className="flex max-h-[min(55vh,560px)] w-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayItem.src}
                  alt={displayItem.alt ?? displayItem.title}
                  className="max-h-[min(55vh,560px)] w-full object-contain"
                />
              </div>
            )}
            {displayItem.type === "video" && (
              <video
                key={displayItem.src}
                src={displayItem.src}
                controls
                playsInline
                className="mx-auto max-h-[min(55vh,560px)] w-full object-contain"
                preload="metadata"
              />
            )}
            {displayItem.type === "audio" && (
              <div className="px-0 py-8 sm:px-4">
                <audio
                  key={displayItem.src}
                  src={displayItem.src}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              </div>
            )}
          </div>

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
                <li key={tag} className="text-black/60">
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
