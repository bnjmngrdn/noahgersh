"use client";

import {
  ObjectInput,
  set,
  useClient,
  type ObjectInputProps,
} from "sanity";
import { useEffect, useRef } from "react";

type TrackValue = {
  _key?: string;
  num?: string;
  title?: string;
  duration?: string;
  audioFile?: { asset?: { _ref?: string } };
} | null;

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/i, "").trim();
  if (!base) return "";
  return base.replace(/[-_]+/g, " ").trim();
}

function useSyncTrackMetadata(
  value: TrackValue,
  onChange: ObjectInputProps["onChange"],
) {
  const client = useClient({ apiVersion: "2025-01-01" });
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const refId = value?.audioFile?.asset?._ref;
    if (!refId) return;

    let cancelled = false;

    (async () => {
      type AssetRow = { url?: string | null; originalFilename?: string | null };
      const row = await client.fetch<AssetRow | null>(
        `*[_id == $id][0]{ "url": url, originalFilename }`,
        { id: refId },
      );
      if (cancelled || !row?.url) return;

      const fileTitle = titleFromFilename(
        row.originalFilename ?? "track",
      );

      const applyPatches = (durationStr: string) => {
        const cur = valueRef.current;
        if (cancelled || !cur) return;
        if (!(cur.title?.trim()) && fileTitle) {
          onChange(set(fileTitle, ["title"]));
        }
        if (!(cur.duration?.trim()) && durationStr) {
          onChange(set(durationStr, ["duration"]));
        }
      };

      const audio = new Audio();
      audio.preload = "metadata";
      audio.src = row.url;

      audio.onloadedmetadata = () => {
        if (cancelled) return;
        const dur = formatDuration(audio.duration);
        applyPatches(dur);
      };

      audio.onerror = () => {
        if (cancelled) return;
        applyPatches("");
      };
    })();

    return () => {
      cancelled = true;
    };
  }, [value?.audioFile?.asset?._ref, client, onChange]);
}

export function ProjectTrackInput(props: ObjectInputProps) {
  useSyncTrackMetadata(props.value as TrackValue, props.onChange);
  return <ObjectInput {...props} />;
}
