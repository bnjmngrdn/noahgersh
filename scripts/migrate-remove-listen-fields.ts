/**
 * Remove legacy listen module fields from project documents after schema removal.
 *
 * Run: npm run sanity:migrate-remove-listen
 * Dry run: npm run sanity:migrate-remove-listen -- --dry-run
 */

import { createClient, type SanityClient } from "@sanity/client";
import { config as loadEnv } from "dotenv";
import { join } from "node:path";

const API_VERSION = "2025-01-01";

loadEnv({ path: join(process.cwd(), ".env.local") });
loadEnv({ path: join(process.cwd(), ".env") });

const QUERY = /* groq */ `
  *[
    _type == "project"
    && (defined(listen) || defined(modules.showListen))
  ] {
    _id,
    title
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

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const client = requireClient();
  const rows = await client.fetch<{ _id: string; title?: string }[]>(QUERY);

  if (rows.length === 0) {
    console.log("No project documents with legacy listen fields.");
    return;
  }

  console.log(
    `${dryRun ? "Would clean" : "Cleaning"} ${rows.length} project document(s)…`,
  );

  for (const row of rows) {
    const label = row.title?.trim() || row._id;
    if (dryRun) {
      console.log(`  would unset listen + modules.showListen on ${label}`);
      continue;
    }

    await client
      .patch(row._id)
      .unset(["listen", "modules.showListen"])
      .commit({ autoGenerateArrayKeys: true });

    console.log(`  cleaned ${label}`);
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
