import type { SchemaTypeDefinition } from "sanity";
import projectTrack from "./projectTrack";
import project from "./project";
import aboutPage from "./aboutPage";
import libraryItem from "./libraryItem";
import tag from "./tag";

export const schemaTypes: SchemaTypeDefinition[] = [
  tag,
  libraryItem,
  projectTrack,
  project,
  aboutPage,
];
