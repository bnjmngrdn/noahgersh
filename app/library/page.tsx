import { getLibraryItems } from "@/lib/sanity/load";
import LibraryMoodboard from "./_components/library-moodboard";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const items = await getLibraryItems();
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full flex-1 flex-col overflow-hidden">
      <LibraryMoodboard items={items} initialOpenLibraryId={open} />
    </div>
  );
}
