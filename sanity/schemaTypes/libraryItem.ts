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
      name: "media",
      title: "Media",
      type: "file",
      description:
        "Upload an image, video, or audio file. The site picks the player from the file type automatically.",
      hidden: ({ parent }) =>
        (parent as { mediaSource?: string } | undefined)?.mediaSource === "youtube",
      options: {
        accept: "image/*,video/*,audio/*",
      },
      validation: (Rule) =>
        Rule.custom((mediaField, context) => {
          const p = context.parent as Record<string, unknown> | undefined;
          if (p?.mediaSource === "youtube") return true;
          const hasLegacy =
            !!(p?.image as { asset?: unknown } | undefined)?.asset ||
            !!(p?.videoFile as { asset?: unknown } | undefined)?.asset ||
            !!(p?.audioFile as { asset?: unknown } | undefined)?.asset;
          if (hasLegacy) return true;
          return !!mediaField || "Upload a media file";
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
      name: "image",
      title: "Image (legacy)",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alt text" }],
      hidden: () => true,
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
