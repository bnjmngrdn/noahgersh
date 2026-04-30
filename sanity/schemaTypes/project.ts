import type { SchemaTypeDefinition } from "sanity";
import { TitleWithAutoSlug } from "../components/title-with-auto-slug";

type ProjectParent = {
  modules?: {
    showArtwork?: boolean;
    showAbout?: boolean;
    showTracklist?: boolean;
    showCredits?: boolean;
    showListen?: boolean;
    showInspiration?: boolean;
  };
};

function mod(parent: unknown): ProjectParent["modules"] {
  return (parent as ProjectParent)?.modules;
}

const project: SchemaTypeDefinition = {
  name: "project",
  title: "Project",
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
      name: "year",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    { name: "artist", type: "string", validation: (Rule) => Rule.required() },
    {
      name: "modules",
      title: "What to show on the site",
      type: "object",
      description:
        "New projects start with everything off. Turn a section on to reveal its fields below, fill them in, then publish.",
      fields: [
        {
          name: "showArtwork",
          title: "Artwork",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "showAbout",
          title: "About",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "showTracklist",
          title: "Tracklist",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "showCredits",
          title: "Credits",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "showListen",
          title: "Listen",
          type: "boolean",
          initialValue: false,
        },
        {
          name: "showInspiration",
          title: "Inspiration",
          type: "boolean",
          initialValue: false,
        },
      ],
    },
    {
      name: "artwork",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alt text" }],
      hidden: ({ parent }) => !mod(parent)?.showArtwork,
    },
    {
      name: "about",
      type: "array",
      of: [{ type: "text", rows: 8 }],
      hidden: ({ parent }) => !mod(parent)?.showAbout,
      validation: (Rule) =>
        Rule.custom((about, { document }) => {
          const show = mod(document)?.showAbout;
          const paragraphs = Array.isArray(about) ? about : [];
          if (show && paragraphs.length === 0) {
            return "Add at least one paragraph, or turn About off above.";
          }
          return true;
        }),
    },
    {
      name: "tracklist",
      type: "array",
      of: [{ type: "projectTrack" }],
      hidden: ({ parent }) => !mod(parent)?.showTracklist,
    },
    {
      name: "credits",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string" },
            { name: "roles", type: "string" },
          ],
        },
      ],
      hidden: ({ parent }) => !mod(parent)?.showCredits,
    },
    {
      name: "listen",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "label",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            { name: "href", type: "url" },
          ],
        },
      ],
      hidden: ({ parent }) => !mod(parent)?.showListen,
    },
    {
      name: "inspiration",
      type: "array",
      of: [{ type: "reference", to: [{ type: "libraryItem" }] }],
      description: "Library tiles shown under Inspiration; click opens library lightbox",
      hidden: ({ parent }) => !mod(parent)?.showInspiration,
    },
  ],
  preview: {
    select: { title: "title", year: "year", artist: "artist" },
    prepare({ title, year, artist }) {
      return {
        title: `${year} — ${title}`,
        subtitle: artist,
      };
    },
  },
  orderings: [
    {
      title: "Year, newest first",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
  ],
};

export default project;
