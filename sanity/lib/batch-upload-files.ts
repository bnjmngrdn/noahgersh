import JSZip from "jszip";

const MEDIA_PATTERN =
  /\.(jpe?g|png|gif|webp|heic|heif|mov|mp4|m4v|m4a|mp3|wav|aac|webm|avi|mkv|flac|ogg)$/i;

const SKIP_ZIP_PATH = /(?:^|\/)(__MACOSX|\.[^/]+)/;

function guessMime(name: string): string {
  const lower = name.toLowerCase();
  if (/\.(jpe?g)$/.test(lower)) return "image/jpeg";
  if (/\.png$/.test(lower)) return "image/png";
  if (/\.gif$/.test(lower)) return "image/gif";
  if (/\.webp$/.test(lower)) return "image/webp";
  if (/\.(mp4|m4v|mov|webm|avi|mkv)$/.test(lower)) return "video/mp4";
  if (/\.(m4a|mp3|wav|aac|flac|ogg)$/.test(lower)) return "audio/mpeg";
  return "application/octet-stream";
}

function isMediaFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("video/")) return true;
  if (file.type.startsWith("audio/")) return true;
  return MEDIA_PATTERN.test(file.name);
}

export function isImageUploadFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name);
}

export function isVideoOrAudioUploadFile(file: File): boolean {
  if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
    return true;
  }
  return /\.(mov|mp4|m4v|m4a|mp3|wav|aac|webm|avi|mkv|flac|ogg)$/i.test(
    file.name,
  );
}

async function filesFromZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const out: File[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || SKIP_ZIP_PATH.test(path)) continue;
    const name = path.split("/").pop() ?? path;
    if (!MEDIA_PATTERN.test(name)) continue;
    const blob = await entry.async("blob");
    out.push(new File([blob], name, { type: blob.type || guessMime(name) }));
  }

  return out;
}

/** Flatten selected files and zip archives into uploadable media files. */
export async function collectBatchUploadFiles(
  fileList: FileList | File[],
): Promise<File[]> {
  const files = Array.from(fileList);
  const out: File[] = [];

  for (const file of files) {
    const isZip =
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.name.toLowerCase().endsWith(".zip");

    if (isZip) {
      out.push(...(await filesFromZip(file)));
      continue;
    }

    if (isMediaFile(file)) out.push(file);
  }

  return out;
}
