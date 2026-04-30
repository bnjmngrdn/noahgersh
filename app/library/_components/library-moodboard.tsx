"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getLibraryItemIndexById, type LibraryItem } from "../_data";
import LibraryLightbox from "./library-lightbox";

// Audio cards have no intrinsic aspect ratio — pin them to a fixed
// width/height ratio so their block stays compact and readable.
const AUDIO_ASPECT_RATIO = 16 / 9;

// Original zigzag column patterns (one column index per position in the cycle).
const COLUMN_PATTERNS: Record<number, number[]> = {
  1: [0],
  2: [0, 1],
  3: [0, 1, 2, 1],
};

// Fallback aspect ratios used while we're still measuring (and if a
// measurement fails). Roughly typical phone-photo / 16:9 video ratios.
const FALLBACK_IMAGE_ASPECT = 3 / 4; // tall photo
const FALLBACK_VIDEO_ASPECT = 16 / 9;

// Responsive column count breakpoints (viewport width in px).
function getColumnsForWidth(w: number): 1 | 2 | 3 {
  if (w < 640) return 1;
  if (w < 1024) return 2;
  return 3;
}

// Scroll behavior.
const BASE_SPEED = 0.6;
const WHEEL_BOOST = 0.18;
/** Touch drag → velocity (mobile; wheel does not fire for finger scroll). */
const TOUCH_BOOST = 0.045;
const DECAY_PER_FRAME = 0.93;

type Aspect = number; // width / height

function indexFromOpenParam(
  open: string | undefined,
  items: LibraryItem[],
): number | null {
  if (!open) return null;
  const i = getLibraryItemIndexById(items, open);
  return i >= 0 ? i : null;
}

export default function LibraryMoodboard({
  items,
  initialOpenLibraryId,
}: {
  items: LibraryItem[];
  initialOpenLibraryId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const yRef = useRef(0);
  const velocityRef = useRef(BASE_SPEED);

  // Aspect ratios per item index (width / height). Measured client-side.
  const [aspects, setAspects] = useState<(Aspect | null)[]>(() =>
    items.map((it) => {
      if (it.type === "audio") return AUDIO_ASPECT_RATIO;
      return null;
    }),
  );

  const [size, setSize] = useState({ width: 0, columns: 3 as 1 | 2 | 3 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(() =>
    indexFromOpenParam(initialOpenLibraryId, items),
  );

  useEffect(() => {
    // Sync ?open= deep links when search params or fetched items change.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional URL → UI sync
    setLightboxIndex(indexFromOpenParam(initialOpenLibraryId, items));
  }, [initialOpenLibraryId, items]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    const id = items[index].id;
    router.replace(
      `${pathname}?open=${encodeURIComponent(id)}`,
      { scroll: false },
    );
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    router.replace(pathname, { scroll: false });
  };

  // Observe viewport width → derive columns + item width.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const w = viewport.clientWidth;
      setSize({ width: w, columns: getColumnsForWidth(w) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, []);

  // Measure aspect ratios for images / videos.
  useEffect(() => {
    let cancelled = false;
    items.forEach((item, i) => {
      if (item.type === "image") {
        const img = new window.Image();
        img.onload = () => {
          if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
          setAspects((prev) => {
            if (prev[i]) return prev;
            const next = prev.slice();
            next[i] = img.naturalWidth / img.naturalHeight;
            return next;
          });
        };
        img.onerror = () => {
          if (cancelled) return;
          setAspects((prev) => {
            if (prev[i]) return prev;
            const next = prev.slice();
            next[i] = FALLBACK_IMAGE_ASPECT;
            return next;
          });
        };
        img.src = item.src;
      } else if (item.type === "video") {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.muted = true;
        v.onloadedmetadata = () => {
          if (cancelled || !v.videoWidth || !v.videoHeight) return;
          setAspects((prev) => {
            if (prev[i]) return prev;
            const next = prev.slice();
            next[i] = v.videoWidth / v.videoHeight;
            return next;
          });
        };
        v.onerror = () => {
          if (cancelled) return;
          setAspects((prev) => {
            if (prev[i]) return prev;
            const next = prev.slice();
            next[i] = FALLBACK_VIDEO_ASPECT;
            return next;
          });
        };
        v.src = item.src;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  // Keep the page from scrolling on mobile; motion is transform-only inside the viewport.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = {
      overflow: html.style.overflow,
      overscroll: html.style.overscrollBehavior,
    };
    const prevBody = {
      overflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prevHtml.overflow;
      html.style.overscrollBehavior = prevHtml.overscroll;
      body.style.overflow = prevBody.overflow;
      body.style.overscrollBehavior = prevBody.overscroll;
    };
  }, []);

  // Compute layout: width per column, item heights, column placement, cycle height.
  const layout = useMemo(() => {
    const { width, columns } = size;
    if (width === 0) {
      return { itemWidth: 0, cycleHeight: 0, placements: [] as Placement[] };
    }
    const itemWidth = width / columns;
    const pattern = COLUMN_PATTERNS[columns];
    // Item N is placed at row N. y = sum of heights of all preceding items
    // (regardless of column). Column = pattern[N % pattern.length].
    // Adjacent items therefore corner-touch diagonally just like the original
    // uniform-height zigzag, but each item now contributes its own height.
    let runningY = 0;
    const placements: Placement[] = items.map((item, i) => {
      const aspect =
        aspects[i] ??
        (item.type === "audio"
          ? AUDIO_ASPECT_RATIO
          : item.type === "video"
            ? FALLBACK_VIDEO_ASPECT
            : FALLBACK_IMAGE_ASPECT);
      const h = itemWidth / aspect;
      const col = pattern[i % pattern.length];
      const top = runningY;
      runningY += h;
      return { col, top, height: h, item, index: i };
    });

    // Cycle height = total content length (sum of all item heights). Each
    // copy of the items spans this height, so translating by it loops cleanly.
    const cycleHeight = runningY;
    return { itemWidth, cycleHeight, placements };
  }, [size, aspects, items]);

  // Auto-scroll loop.
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    if (layout.cycleHeight === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cycleHeight = layout.cycleHeight;

    if (yRef.current >= cycleHeight) yRef.current %= cycleHeight;

    let rafId = 0;
    let lastTime = performance.now();
    let lastTouchY: number | null = null;

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 16.667, 4);
      lastTime = now;

      yRef.current += velocityRef.current * dt;
      if (yRef.current >= cycleHeight) yRef.current -= cycleHeight;
      if (yRef.current < 0) yRef.current += cycleHeight;

      if (track) {
        track.style.transform = `translate3d(0, ${-yRef.current}px, 0)`;
      }

      const decay = Math.pow(DECAY_PER_FRAME, dt);
      velocityRef.current =
        BASE_SPEED + (velocityRef.current - BASE_SPEED) * decay;

      rafId = requestAnimationFrame(tick);
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      velocityRef.current += e.deltaY * WHEEL_BOOST;
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1 || lastTouchY === null) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      const dy = lastTouchY - y;
      lastTouchY = y;
      velocityRef.current += dy * TOUCH_BOOST;
    }

    function onTouchEnd() {
      lastTouchY = null;
    }

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", onTouchEnd);
    viewport.addEventListener("touchcancel", onTouchEnd);
    if (!reduced) rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", onTouchEnd);
      viewport.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [layout.cycleHeight]);

  const sizesAttr =
    size.columns === 1 ? "100vw" : size.columns === 2 ? "50vw" : "33vw";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden overscroll-none select-none"
        aria-label="Library moodboard"
      >
        <div
          ref={trackRef}
          className="absolute inset-x-0 top-0 will-change-transform"
          style={{ height: layout.cycleHeight * 2 }}
        >
          {layout.itemWidth > 0 &&
            // Render each item twice (offset by cycleHeight) for seamless looping.
            [0, 1].map((copy) =>
              layout.placements.map((p) => (
                <ItemBlock
                  key={`${copy}-${p.index}`}
                  placement={p}
                  itemWidth={layout.itemWidth}
                  yOffset={copy * layout.cycleHeight}
                  sizesAttr={sizesAttr}
                  eager={copy === 0 && p.index < 4}
                  onOpen={() => openLightbox(p.index)}
                />
              )),
            )}
        </div>
      </div>
      <LibraryLightbox
        item={lightboxIndex !== null ? items[lightboxIndex] : null}
        onClose={closeLightbox}
      />
    </div>
  );
}

type Placement = {
  col: number;
  top: number;
  height: number;
  item: LibraryItem;
  index: number;
};

function ItemBlock({
  placement,
  itemWidth,
  yOffset,
  sizesAttr,
  eager,
  onOpen,
}: {
  placement: Placement;
  itemWidth: number;
  yOffset: number;
  sizesAttr: string;
  eager: boolean;
  onOpen: () => void;
}) {
  const { col, top, height, item } = placement;

  return (
    <div
      className="absolute"
      style={{
        left: col * itemWidth,
        top: top + yOffset,
        width: itemWidth,
        height,
      }}
    >
      <button
        type="button"
        className="relative h-full w-full cursor-pointer overflow-hidden border-0 bg-black/[0.06] p-0 text-left"
        aria-label={`Open ${item.title}`}
        onClick={onOpen}
      >
        {item.type === "image" && (
          <Image
            src={item.src}
            alt={item.alt ?? item.title}
            fill
            className="pointer-events-none object-cover"
            sizes={sizesAttr}
            priority={eager}
          />
        )}
        {item.type === "video" && (
          <video
            src={item.src}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            className="pointer-events-none h-full w-full object-cover"
          />
        )}
        {item.type === "audio" && (
          <AudioCard title={item.title} />
        )}
      </button>
    </div>
  );
}

function AudioCard({ title }: { title: string }) {
  return (
    <div className="pointer-events-none flex h-full w-full flex-col justify-between bg-black/[0.04] p-6">
      <div className="text-[11px] font-medium tracking-[0.02em] text-black/60">AUDIO</div>
      <div className="text-[11px] font-medium text-black">{title}</div>
    </div>
  );
}
