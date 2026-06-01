import createImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const builder = createImageUrlBuilder({ projectId, dataset });

export type SanityImageInput = SanityImageSource;

export type SanityImageUrlOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

const DEFAULT_QUALITY = 80;

export function hasSanityImageSource(
  source: SanityImageInput | null | undefined,
): source is SanityImageInput {
  if (!source || typeof source !== "object") return false;
  const asset = (source as { asset?: { _ref?: string; _id?: string } }).asset;
  return Boolean(asset?._ref || asset?._id);
}

export function sanityImageUrl(
  source: SanityImageInput,
  { width, height, quality = DEFAULT_QUALITY }: SanityImageUrlOptions = {},
): string {
  let image = builder.image(source).auto("format").quality(quality);
  if (width) image = image.width(Math.round(width));
  if (height) image = image.height(Math.round(height));
  return image.url();
}

export function sanityImageSrcSet(
  source: SanityImageInput,
  widths: number[],
  quality = DEFAULT_QUALITY,
): string {
  return widths
    .map((width) => `${sanityImageUrl(source, { width, quality })} ${width}w`)
    .join(", ");
}

export function sanityImageDimensions(
  source: SanityImageInput | null | undefined,
): { width: number; height: number } | null {
  if (!source || typeof source !== "object") return null;
  const dimensions = (
    source as {
      asset?: { metadata?: { dimensions?: { width?: number; height?: number } } };
    }
  ).asset?.metadata?.dimensions;
  if (!dimensions?.width || !dimensions?.height) return null;
  return { width: dimensions.width, height: dimensions.height };
}

/** Responsive widths for library grid tiles (up to 3 columns). */
export const LIBRARY_GRID_WIDTHS = [480, 768, 1024, 1280, 1600];

/** Widths for smaller thumbnails (inspiration grid, artwork). */
export const THUMB_WIDTHS = [320, 480, 640, 900];

/** Single large width for lightbox / hero-style images. */
export const LIGHTBOX_WIDTH = 1800;

export function isOptimizableImageSrc(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    const { hostname, pathname } = new URL(src);
    if (hostname === "cdn.sanity.io") {
      return pathname.startsWith("/files/") || pathname.startsWith("/images/");
    }
  } catch {
    return false;
  }
  return false;
}

/** Next.js image optimizer URLs (for legacy Sanity file assets + local files). */
export function nextOptimizedImageUrl(
  src: string,
  width: number,
  quality = DEFAULT_QUALITY,
): string {
  const params = new URLSearchParams({
    url: src,
    w: String(Math.round(width)),
    q: String(quality),
  });
  return `/_next/image?${params.toString()}`;
}

export function nextOptimizedImageSrcSet(
  src: string,
  widths: number[],
  quality = DEFAULT_QUALITY,
): string {
  return widths
    .map((width) => `${nextOptimizedImageUrl(src, width, quality)} ${width}w`)
    .join(", ");
}

export function resolveImageDelivery(
  source: SanityImageInput | null | undefined,
  fallbackSrc: string,
  {
    widths = LIBRARY_GRID_WIDTHS,
    quality = DEFAULT_QUALITY,
    defaultWidth,
  }: {
    widths?: number[];
    quality?: number;
    defaultWidth?: number;
  } = {},
): { mode: "sanity" | "optimized"; src: string; srcSet?: string } {
  if (hasSanityImageSource(source)) {
    const width = defaultWidth ?? widths[widths.length - 1] ?? 1280;
    return {
      mode: "sanity",
      src: sanityImageUrl(source, { width, quality }),
      srcSet: sanityImageSrcSet(source, widths, quality),
    };
  }

  if (isOptimizableImageSrc(fallbackSrc)) {
    const width = defaultWidth ?? widths[widths.length - 1] ?? 1280;
    return {
      mode: "optimized",
      src: nextOptimizedImageUrl(fallbackSrc, width, quality),
      srcSet: nextOptimizedImageSrcSet(fallbackSrc, widths, quality),
    };
  }

  return {
    mode: "optimized",
    src: fallbackSrc,
  };
}
