import "server-only";
import { createClient, type QueryParams } from "next-sanity";

export const apiVersion = "2025-01-01";

/**
 * Private Sanity datasets return no documents without a token. Use a Viewer
 * token in production; for local dev the write token is enough (server-only).
 */
function serverSanityToken(): string | undefined {
  return (
    process.env.SANITY_API_READ_TOKEN ||
    process.env.SANITY_API_WRITE_TOKEN ||
    undefined
  );
}

export function isSanityConfigured(): boolean {
  const id = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  return Boolean(id && id !== "placeholder");
}

const token = serverSanityToken();

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion,
  // Authenticated requests must not use the CDN edge cache.
  useCdn: Boolean(!token && process.env.NODE_ENV === "production"),
  token,
});

export function sanityFetch<T>(query: string, params?: QueryParams, tags?: string[]) {
  return sanityClient.fetch<T>(query, params ?? {}, {
    next: {
      revalidate: process.env.SANITY_REVALIDATE_SECRET ? 3600 : 30,
      tags: tags ?? ["sanity"],
    },
  });
}
