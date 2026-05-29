import { getLibraryItems } from "@/lib/sanity/load";
import LibraryMoodboard from "./_components/library-moodboard";

/** Fresh shuffle on each visit. */
export const revalidate = 0;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const items = shuffle(await getLibraryItems());
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full flex-1 flex-col overflow-hidden">
      <LibraryMoodboard items={items} initialOpenLibraryId={open} />
    </div>
  );
}
