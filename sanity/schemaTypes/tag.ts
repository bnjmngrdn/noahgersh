import type { SchemaTypeDefinition } from "sanity";
import { TitleWithAutoSlug } from "../components/title-with-auto-slug";

const tag: SchemaTypeDefinition = {
  name: "tag",
  title: "Tag",
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
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title };
    },
  },
};

export default tag;
