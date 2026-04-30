/**
 * One-shot: push local `public/` media + `_data` into Sanity (idempotent).
 *
 * Prerequisites:
 *   1. .env.local with NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET
 *   2. SANITY_API_WRITE_TOKEN — create at sanity.io/manage → your project → API → Tokens
 *      (role: Editor, or Developer with write)
 *
 * Run: npm run sanity:seed
 */

import { createClient, type SanityClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { config as loadEnv } from "dotenv";
import { randomBytes } from "node:crypto";
import { libraryItems, type LibraryItem } from "../app/library/_data";
import { projects } from "../app/projects/_data";
import { ABOUT_FALLBACK_PARAGRAPHS } from "../lib/content/about-fallback-paragraphs";
import { ABOUT_PAGE_DOCUMENT_ID } from "../sanity/constants";

const API_VERSION = "2025-01-01";

loadEnv({ path: join(process.cwd(), ".env.local") });
loadEnv({ path: join(process.cwd(), ".env") });

function rndKey(): string {
  return randomBytes(8).toString("hex");
}

function paragraphBlock(text: string) {
  const bk = rndKey();
  return {
    _type: "block",
    _key: bk,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `${bk}-s`,
        marks: [],
        text,
      },
    ],
  };
}

function slugifyTag(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function publicFilePath(src: string): string {
  const rel = decodeURIComponent(src.replace(/^\//, ""));
  return join(process.cwd(), "public", rel);
}

function requireEnv(): SanityClient {
  const projectId =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
  const token =
    process.env.SANITY_API_WRITE_TOKEN ?? process.env.SANITY_API_TOKEN;

  if (!projectId || projectId === "placeholder") {
    console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local");
    process.exit(1);
  }
  if (!token) {
    console.error(
      [
        "Missing SANITY_API_WRITE_TOKEN in .env.local",
        "",
        "Create a token: https://www.sanity.io/manage",
        "→ Project → API → Tokens → Add API token (Editor)",
        "",
        "Add to .env.local:",
        "SANITY_API_WRITE_TOKEN=sk...",
      ].join("\n"),
    );
    process.exit(1);
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
  });
}

async function uploadImage(client: SanityClient, absPath: string, filename: string) {
  const buf = readFileSync(absPath);
  return client.assets.upload("image", buf, { filename });
}

async function uploadFile(client: SanityClient, absPath: string, filename: string) {
  const buf = readFileSync(absPath);
  return client.assets.upload("file", buf, { filename });
}

function libraryDoc(
  item: LibraryItem,
  tagRefs: { _type: "reference"; _ref: string }[],
  fileAssetId: string,
) {
  const _id = `libraryItem.${item.id}`;
  const base = {
    _id,
    _type: "libraryItem" as const,
    title: item.title,
    slug: { _type: "slug" as const, current: item.id },
    description: item.description,
    tags: tagRefs,
    media: {
      _type: "file" as const,
      asset: { _type: "reference" as const, _ref: fileAssetId },
    },
  };

  if (item.type === "image") {
    return {
      ...base,
      alt: item.alt ?? item.title,
    };
  }

  return base;
}

async function main() {
  const client = requireEnv();
  console.log("Seeding Sanity…");

  const uniqueTagTitles = new Set<string>();
  for (const item of libraryItems) {
    for (const t of item.tags) uniqueTagTitles.add(t);
  }

  const tagIdByTitle = new Map<string, string>();
  for (const title of uniqueTagTitles) {
    const slug = slugifyTag(title);
    const _id = `tag.${slug}`;
    tagIdByTitle.set(title, _id);
    await client.createOrReplace({
      _id,
      _type: "tag",
      title,
      slug: { _type: "slug", current: slug },
    });
  }
  console.log(`  Tags: ${uniqueTagTitles.size}`);

  for (const item of libraryItems) {
    const p = publicFilePath(item.src);
    if (!existsSync(p)) {
      console.error(`Missing file: ${p}`);
      process.exit(1);
    }
    const filename = basename(p);
    const tagRefs = item.tags.map((t) => ({
      _type: "reference" as const,
      _ref: tagIdByTitle.get(t)!,
    }));

    const asset = await uploadFile(client, p, filename);
    const fileId = asset._id;

    const doc = libraryDoc(item, tagRefs, fileId);
    await client.createOrReplace(
      doc as Record<string, unknown> & { _id: string; _type: string },
    );
    console.log(`  Library: ${item.id}`);
  }

  for (const project of projects) {
    const inspirationRefs = project.inspiration
      .filter((i) => i.libraryItemId)
      .map((i) => ({
        _type: "reference" as const,
        _ref: `libraryItem.${i.libraryItemId}`,
        _key: rndKey(),
      }));

    let artwork: { _type: "image"; asset: { _type: "reference"; _ref: string }; alt?: string } | undefined;

    if (project.artwork?.src) {
      const ap = publicFilePath(project.artwork.src);
      if (existsSync(ap)) {
        const asset = await uploadImage(client, ap, basename(ap));
        artwork = {
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
          alt: project.artwork.alt,
        };
      }
    }

    const doc = {
      _id: `project.${project.id}`,
      _type: "project" as const,
      title: project.title,
      slug: { _type: "slug" as const, current: project.id },
      year: project.year,
      artist: project.artist,
      modules: project.modules,
      ...(artwork ? { artwork } : {}),
      about: project.about,
      tracklist: (project.tracklist ?? []).map((t) => ({
        _key: rndKey(),
        num: t.num,
        title: t.title,
        duration: t.duration,
      })),
      credits: (project.credits ?? []).map((c) => ({
        _key: rndKey(),
        name: c.name,
        roles: c.roles,
      })),
      listen: (project.listen ?? []).map((l) => ({
        _key: rndKey(),
        label: l.label,
        ...(l.href ? { href: l.href } : {}),
      })),
      inspiration: inspirationRefs,
    };

    await client.createOrReplace(doc);
    console.log(`  Project: ${project.id}`);
  }

  const aboutDoc = {
    _id: ABOUT_PAGE_DOCUMENT_ID,
    _type: "aboutPage" as const,
    body: ABOUT_FALLBACK_PARAGRAPHS.map((t) => paragraphBlock(t)),
  };
  await client.createOrReplace(aboutDoc);
  console.log(`  About: ${ABOUT_PAGE_DOCUMENT_ID}`);

  console.log("\nDone. Open /studio (Website → About / Library / Projects) and your site pages.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
