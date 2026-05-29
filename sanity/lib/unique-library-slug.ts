import type { SanityClient } from "@sanity/client";
import { slugifyTitle } from "./slugify-title";

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base || filename;
}

export async function uniqueLibrarySlug(
  client: SanityClient,
  title: string,
): Promise<string> {
  const base = slugifyTitle(title) || "item";
  let candidate = base;
  let n = 2;

  while (true) {
    const existing = await client.fetch<string | null>(
      `*[_type == "libraryItem" && slug.current == $slug][0]._id`,
      { slug: candidate },
    );
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}
