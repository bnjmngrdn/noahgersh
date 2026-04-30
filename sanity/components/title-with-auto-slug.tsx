"use client";

import {
  PatchEvent,
  StringInput,
  set,
  unset,
  useFormCallbacks,
  useFormValue,
  type StringInputProps,
} from "sanity";
import { useEffect, useRef } from "react";
import { slugifyTitle } from "../lib/slugify-title";

/**
 * Wraps the document `title` field and keeps sibling `slug` in sync when the
 * slug field is hidden from the form.
 */
export function TitleWithAutoSlug(props: StringInputProps) {
  const { onChange } = useFormCallbacks();
  const doc = useFormValue([]) as { slug?: { current?: string } } | undefined;
  const value = props.value;
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  const currentSlug = doc?.slug?.current ?? "";

  useEffect(() => {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) {
      if (currentSlug !== "") {
        onChange(PatchEvent.from(unset(["slug"])));
      }
      return;
    }
    const next = slugifyTitle(raw);
    if (next === currentSlug) return;
    onChange(
      PatchEvent.from(set({ _type: "slug", current: next }, ["slug"])),
    );
  }, [value, onChange, currentSlug]);

  return <StringInput {...props} />;
}
