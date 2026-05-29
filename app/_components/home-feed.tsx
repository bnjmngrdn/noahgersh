import type { LibraryItem } from "@/app/library/_data";
import FeedMedia from "./feed-media";

type FeedItem = Extract<LibraryItem, { type: "image" | "youtube" }>;

export default function HomeFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-[11px] text-black/30 sm:px-8">
        No homepage posts yet. Enable “Show on homepage” on a library item in the CMS.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-14 px-4 py-8 sm:px-8">
      {items.map((item, index) => (
        <article key={item.id}>
          <FeedMedia item={item} priority={index === 0} />
        </article>
      ))}
    </div>
  );
}
