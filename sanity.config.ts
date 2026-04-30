import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";
import { studioTheme } from "./sanity/studio-theme";

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "default",
  title: "Noah Gersh",
  projectId,
  dataset,
  basePath: "/studio",
  theme: studioTheme,
  releases: {
    enabled: false,
  },
  scheduledDrafts: {
    enabled: false,
  },
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
  },
});
