import {
  resolveImageDelivery,
  type SanityImageInput,
} from "@/lib/sanity/image";

type OptimizedImageProps = {
  source?: SanityImageInput | null;
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  widths?: number[];
  defaultWidth?: number;
  quality?: number;
} & (
  | {
      fill: true;
      width?: never;
      height?: never;
    }
  | {
      fill?: false;
      width: number;
      height: number;
    }
);

export default function OptimizedImage({
  source,
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  widths,
  defaultWidth,
  quality,
  fill,
  width,
  height,
}: OptimizedImageProps) {
  const delivery = resolveImageDelivery(source, src, {
    widths,
    defaultWidth,
    quality,
  });

  const imgClass = fill
    ? `absolute inset-0 h-full w-full ${className}`.trim()
    : className;

  if (delivery.mode === "sanity" || delivery.srcSet) {
    return (
      // Sanity CDN or Next.js optimizer (legacy file assets) — responsive srcSet.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={delivery.src}
        srcSet={delivery.srcSet}
        sizes={sizes}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={imgClass}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={delivery.src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={imgClass}
    />
  );
}
