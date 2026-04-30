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
      name: "media",
      title: "Media",
      type: "file",
      description:
        "Upload an image, video, or audio file. The site picks the player from the file type automatically.",
      options: {
        accept: "image/*,video/*,audio/*",
      },
      validation: (Rule) =>
        Rule.custom((mediaField, context) => {
          const p = context.parent as Record<string, unknown> | undefined;
          const hasLegacy =
            !!(p?.image as { asset?: unknown } | undefined)?.asset ||
            !!(p?.videoFile as { asset?: unknown } | undefined)?.asset ||
            !!(p?.audioFile as { asset?: unknown } | undefined)?.asset;
          if (hasLegacy) return true;
          return !!mediaField || "Upload a media file";
        }),
    },
    {
      name: "alt",
      title: "Alt text",
      type: "string",
      description:
        "For images: short description for screen readers. Optional for video/audio.",
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
      validation: (Rule) => Rule.required(),
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
      hasLegacyImage: "image.asset",
      hasLegacyVideo: "videoFile.asset",
      hasLegacyAudio: "audioFile.asset",
      hasMedia: "media.asset",
      desc: "description",
    },
    prepare(selection: {
      title?: string;
      hasLegacyImage?: unknown;
      hasLegacyVideo?: unknown;
      hasLegacyAudio?: unknown;
      hasMedia?: unknown;
      desc?: string;
    }) {
      const {
        title,
        hasLegacyImage,
        hasLegacyVideo,
        hasLegacyAudio,
        hasMedia,
        desc,
      } = selection;
      const hasFile = Boolean(
        hasMedia || hasLegacyImage || hasLegacyVideo || hasLegacyAudio,
      );
      const subtitle =
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
