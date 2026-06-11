import type { PortableTextBlock } from "@portabletext/types";
import { libraryItems as staticLibraryItems } from "@/app/library/_data";
import type { LibraryItem } from "@/app/library/_data";
import { projects as staticProjects, defaultProjectModules, type Credit, type InspirationItem, type Project, type ProjectModules, type Track } from "@/app/projects/_data";
import { parseYouTubeVideoId } from "@/lib/youtube";
import type { SanityImageInput } from "@/lib/sanity/image";
import { isSanityConfigured, sanityFetch } from "./client";
import { aboutQuery, homepageFeedQuery, libraryQuery, projectsQuery } from "./queries";

type RawLibraryRow = {
  id: string;
  title: string;
  type: string;
  src: string | null;
  imageSource?: SanityImageInput | null;
  youtubeUrl?: string | null;
  alt?: string | null;
  description: string;
  tags: string[];
  createdAt?: string | null;
  showOnHomepage?: boolean | null;
};

function mapLibraryRow(r: RawLibraryRow): LibraryItem | null {
  const base = {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    tags: r.tags ?? [],
    createdAt: r.createdAt ?? undefined,
    showOnHomepage: r.showOnHomepage ?? undefined,
  };

  if (r.type === "youtube") {
    const videoId = parseYouTubeVideoId(r.youtubeUrl ?? "");
    if (!videoId) return null;
    return { ...base, type: "youtube", videoId };
  }

  if (!r.src) return null;

  if (r.type === "image") {
    return {
      ...base,
      type: "image",
      src: r.src,
      imageSource: r.imageSource ?? undefined,
      alt: r.alt ?? undefined,
    };
  }
  if (r.type === "video") {
    return { ...base, type: "video", src: r.src, alt: r.alt ?? undefined };
  }
  if (r.type === "audio") {
    return { ...base, type: "audio", src: r.src };
  }
  return null;
}

function isHomepageFeedItem(item: LibraryItem): item is Extract<
  LibraryItem,
  { type: "image" | "youtube" }
> {
  return item.type === "image" || item.type === "youtube";
}

function sortByCreatedAtDesc(items: LibraryItem[]): LibraryItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );
}

type RawProjectRow = {
  id: string | null;
  sanityDocumentId?: string;
  year: string;
  artist: string;
  title: string;
  modules?: Partial<ProjectModules> | null;
  artwork?: {
    src: string;
    alt: string;
    imageSource?: SanityImageInput | null;
  } | null;
  about: string[] | null;
  tracklist: Track[] | null;
  credits: Credit[] | null;
  inspiration: InspirationItem[] | null;
};

function projectIdFromRow(r: RawProjectRow): string | null {
  const slug = r.id?.trim();
  if (slug) return slug;
  const raw = r.sanityDocumentId?.trim();
  if (!raw) return null;
  if (raw.startsWith("project.")) return raw.slice("project.".length);
  return raw;
}

function mapProjectRow(r: RawProjectRow): Project | null {
  const id = projectIdFromRow(r);
  if (!id) return null;
  const inspiration = (r.inspiration ?? []).filter(
    (i): i is InspirationItem =>
      Boolean(i?.libraryItemId && typeof i.libraryItemId === "string"),
  );
  const m = r.modules ?? {};
  const modules: ProjectModules = {
    showArtwork: m.showArtwork ?? defaultProjectModules.showArtwork,
    showAbout: m.showAbout ?? defaultProjectModules.showAbout,
    showTracklist: m.showTracklist ?? defaultProjectModules.showTracklist,
    showCredits: m.showCredits ?? defaultProjectModules.showCredits,
    showInspiration: m.showInspiration ?? defaultProjectModules.showInspiration,
  };
  return {
    id,
    year: r.year,
    artist: r.artist,
    title: r.title,
    modules,
    artwork: r.artwork?.src
      ? {
          src: r.artwork.src,
          alt: r.artwork.alt,
          imageSource: r.artwork.imageSource ?? undefined,
        }
      : undefined,
    about: r.about ?? [],
    tracklist: r.tracklist ?? [],
    credits: r.credits ?? [],
    inspiration,
  };
}

export async function getLibraryItems(): Promise<LibraryItem[]> {
  if (!isSanityConfigured()) return staticLibraryItems;
  const rows = await sanityFetch<RawLibraryRow[]>(libraryQuery);
  return rows
    .map(mapLibraryRow)
    .filter((x): x is LibraryItem => x !== null);
}

export async function getHomepageFeedItems(): Promise<
  Extract<LibraryItem, { type: "image" | "youtube" }>[]
> {
  if (!isSanityConfigured()) {
    return sortByCreatedAtDesc(staticLibraryItems)
      .filter(isHomepageFeedItem)
      .filter((item) => item.showOnHomepage);
  }
  const rows = await sanityFetch<RawLibraryRow[]>(homepageFeedQuery);
  return rows
    .map(mapLibraryRow)
    .filter((x): x is LibraryItem => x !== null)
    .filter(isHomepageFeedItem);
}

export async function getProjects(): Promise<Project[]> {
  if (!isSanityConfigured()) return staticProjects;
  const rows = await sanityFetch<RawProjectRow[]>(projectsQuery);
  return rows
    .map(mapProjectRow)
    .filter((p): p is Project => p !== null);
}

type AboutFromSanity = { body: PortableTextBlock[] } | null;

export async function getAboutBody(): Promise<PortableTextBlock[] | null> {
  if (!isSanityConfigured()) return null;
  const doc = await sanityFetch<AboutFromSanity>(aboutQuery);
  const body = doc?.body;
  if (!Array.isArray(body) || body.length === 0) return null;
  return body;
}
