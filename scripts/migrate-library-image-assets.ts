/**
 * Convert library items that store photos as generic file assets into Sanity
 * image assets (enables CDN auto-format + width transforms). No manual re-upload.
 *
 * Run: npm run sanity:migrate-images
 * Dry run: npm run sanity:migrate-images -- --dry-run
 */

import { createClient, type SanityClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { join } from "node:path";

const API_VERSION = "2025-01-01";

loadEnv({ path: join(process.cwd(), ".env.local") });
loadEnv({ path: join(process.cwd(), ".env") });

type Row = {
  _id: string;
  title?: string;
  alt?: string;
  assetId: string;
  assetUrl: string;
  filename?: string;
};

const QUERY = /* groq */ `
  *[
    _type == "libraryItem"
    && !defined(image.asset)
    && defined(media.asset)
    && string::startsWith(coalesce(media.asset->mimeType, ""), "image/")
  ] {
    _id,
    title,
    "alt": coalesce(image.alt, title),
    "assetId": media.asset._ref,
    "assetUrl": media.asset->url,
    "filename": media.asset->originalFilename
  }
`;

function requireClient(): SanityClient {
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
    console.error("Missing SANITY_API_WRITE_TOKEN in .env.local");
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

async function migrateRow(
  client: SanityClient,
  row: Row,
  dryRun: boolean,
): Promise<"migrated" | "skipped" | "failed"> {
  if (!row.assetUrl) {
    console.warn(`  skip ${row._id}: missing asset URL`);
    return "skipped";
  }

  if (dryRun) {
    console.log(`  would migrate ${row._id} (${row.filename ?? row.title ?? "image"})`);
    return "migrated";
  }

  try {
    const response = await fetch(row.assetUrl);
    if (!response.ok) {
      throw new Error(`fetch failed (${response.status})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = row.filename ?? `${row.title ?? "library"}.jpg`;
    const uploaded = await client.assets.upload("image", buffer, { filename });

    await client
      .patch(row._id)
      .set({
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: uploaded._id },
          alt: row.alt ?? row.title ?? "",
        },
      })
      .unset(["media"])
      .commit();

    console.log(`  migrated ${row._id} → ${uploaded._id}`);
    return "migrated";
  } catch (error) {
    console.error(
      `  failed ${row._id}:`,
      error instanceof Error ? error.message : error,
    );
    return "failed";
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const client = requireClient();
  const rows = await client.fetch<Row[]>(QUERY);

  console.log(
    dryRun
      ? `Dry run — ${rows.length} library image(s) to migrate`
      : `Migrating ${rows.length} library image(s)…`,
  );

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await migrateRow(client, row, dryRun);
    if (result === "migrated") migrated += 1;
    else if (result === "skipped") skipped += 1;
    else failed += 1;
  }

  console.log(
    `\nDone. ${dryRun ? "Would migrate" : "Migrated"}: ${migrated}, skipped: ${skipped}, failed: ${failed}`,
  );

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
