import type { SchemaTypeDefinition } from "sanity";

const aboutPage: SchemaTypeDefinition = {
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    {
      name: "body",
      type: "array",
      of: [{ type: "block" }],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    prepare() {
      return { title: "About" };
    },
  },
};

export default aboutPage;
