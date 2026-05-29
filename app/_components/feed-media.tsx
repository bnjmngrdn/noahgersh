import Image from "next/image";
import type { LibraryItem } from "@/app/library/_data";
import { youtubeEmbedUrl } from "@/lib/youtube";

type FeedItem = Extract<LibraryItem, { type: "image" | "youtube" }>;

export default function FeedMedia({
  item,
  priority = false,
}: {
  item: FeedItem;
  priority?: boolean;
}) {
  if (item.type === "youtube") {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black/[0.04]">
        <iframe
          src={youtubeEmbedUrl(item.videoId)}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-black/[0.04]">
      <Image
        src={item.src}
        alt={item.alt ?? item.title}
        width={900}
        height={900}
        className="h-auto w-full"
        sizes="(min-width: 900px) 900px, 100vw"
        priority={priority}
      />
    </div>
  );
}
