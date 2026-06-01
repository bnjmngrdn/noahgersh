import type { SchemaTypeDefinition } from "sanity";
import { TitleWithAutoSlug } from "../components/title-with-auto-slug";

const libraryItem: SchemaTypeDefinition = {
  name: "libraryItem",
  title: "Library item",
  type: "document",
  fields: [
    {
      name: "title",
      type: "string",
      components: { input: TitleWithAutoSlug },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "slug",
      type: "slug",
      hidden: () => true,
      options: { maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: "showOnHomepage",
      title: "Show on homepage",
      type: "boolean",
      description: "When enabled, this item appears on the homepage feed (newest first).",
      initialValue: false,
    },
    {
      name: "mediaSource",
      title: "Media source",
      type: "string",
      options: {
        list: [
          { title: "Upload", value: "upload" },
          { title: "YouTube", value: "youtube" },
        ],
        layout: "radio",
      },
      initialValue: "upload",
    },
    {
      name: "youtubeUrl",
      title: "YouTube URL",
      type: "url",
      description: "Paste a YouTube watch, embed, or youtu.be link.",
      hidden: ({ parent }) =>
        (parent as { mediaSource?: string } | undefined)?.mediaSource === "upload",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const source = (context.parent as { mediaSource?: string } | undefined)
            ?.mediaSource;
          if (source !== "youtube") return true;
          return value ? true : "YouTube URL is required";
        }),
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alt text" }],
      description:
        "Upload a photo. Sanity automatically optimizes images for the web (format, size).",
      hidden: ({ parent }) =>
        (parent as { mediaSource?: string } | undefined)?.mediaSource === "youtube",
    },
    {
      name: "media",
      title: "Video or audio",
      type: "file",
      description: "Upload a video or audio file.",
      hidden: ({ parent }) =>
        (parent as { mediaSource?: string } | undefined)?.mediaSource === "youtube",
      options: {
        accept: "video/*,audio/*",
      },
      validation: (Rule) =>
        Rule.custom((mediaField, context) => {
          const p = context.parent as Record<string, unknown> | undefined;
          if (p?.mediaSource === "youtube") return true;
          if ((p?.image as { asset?: unknown } | undefined)?.asset) return true;
          if (
            (p?.videoFile as { asset?: unknown } | undefined)?.asset ||
            (p?.audioFile as { asset?: unknown } | undefined)?.asset
          ) {
            return true;
          }
          return !!mediaField || true;
        }),
    },
    {
      name: "mediaType",
      title: "Media type (legacy)",
      type: "string",
      hidden: () => true,
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
          { title: "Audio", value: "audio" },
        ],
      },
    },
    {
      name: "videoFile",
      title: "Video file (legacy)",
      type: "file",
      options: { accept: "video/*" },
      hidden: () => true,
    },
    {
      name: "audioFile",
      title: "Audio file (legacy)",
      type: "file",
      options: { accept: "audio/*" },
      hidden: () => true,
    },
    {
      name: "description",
      type: "text",
      rows: 4,
    },
    {
      name: "tags",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
    },
  ],
  preview: {
    select: {
      title: "title",
      showOnHomepage: "showOnHomepage",
      mediaSource: "mediaSource",
      hasLegacyImage: "image.asset",
      hasLegacyVideo: "videoFile.asset",
      hasLegacyAudio: "audioFile.asset",
      hasMedia: "media.asset",
      desc: "description",
    },
    prepare(selection: {
      title?: string;
      showOnHomepage?: boolean;
      mediaSource?: string;
      hasLegacyImage?: unknown;
      hasLegacyVideo?: unknown;
      hasLegacyAudio?: unknown;
      hasMedia?: unknown;
      desc?: string;
    }) {
      const {
        title,
        showOnHomepage,
        mediaSource,
        hasLegacyImage,
        hasLegacyVideo,
        hasLegacyAudio,
        hasMedia,
        desc,
      } = selection;
      const hasFile = Boolean(
        hasMedia || hasLegacyImage || hasLegacyVideo || hasLegacyAudio,
      );
      const flags = [
        showOnHomepage ? "Homepage" : null,
        mediaSource === "youtube" ? "YouTube" : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const subtitle =
        flags ||
        (typeof desc === "string" && desc.trim().slice(0, 72)) ||
        (hasFile ? "Has media" : "No media") ||
        "";
      return {
        title: title?.trim() || "Untitled",
        subtitle,
      };
    },
  },
};

export default libraryItem;
