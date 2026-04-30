import type { SchemaTypeDefinition } from "sanity";
import { ProjectTrackInput } from "../components/project-track-input";

const projectTrack: SchemaTypeDefinition = {
  name: "projectTrack",
  title: "Track",
  type: "object",
  components: { input: ProjectTrackInput },
  fields: [
    {
      name: "audioFile",
      title: "Audio file",
      type: "file",
      description: "Upload a track; title and duration can auto-fill (empty fields only).",
      options: {
        accept: "audio/*",
      },
    },
    {
      name: "num",
      title: "Track #",
      type: "string",
      description: 'e.g. "01"',
    },
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "duration",
      title: "Duration",
      type: "string",
      description: 'e.g. "3:45". Usually filled from the audio file.',
    },
  ],
  preview: {
    select: { title: "title", num: "num", media: "audioFile" },
    prepare({ title, num, media }) {
      return {
        title: [num, title].filter(Boolean).join(" — ") || "Track",
        subtitle: media ? "Has audio" : "No file",
      };
    },
  },
};

export default projectTrack;
