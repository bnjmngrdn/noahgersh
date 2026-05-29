/** Extract a YouTube video ID from common URL formats. */
export function parseYouTubeVideoId(input: string): string | null {
  const url = input.trim();
  if (!url) return null;

  if (/^[\w-]{11}$/.test(url)) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id.length === 11 ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id && id.length === 11 ? id : null;
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]?.length === 11) {
        return parts[embedIndex + 1];
      }
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]?.length === 11) {
        return parts[shortsIndex + 1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
