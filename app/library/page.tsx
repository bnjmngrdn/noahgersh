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
    <LibraryMoodboard items={items} initialOpenLibraryId={open} />
  );
}
