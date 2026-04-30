import type { StructureResolver } from "sanity/structure";
import { ABOUT_PAGE_DOCUMENT_ID } from "./constants";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Website")
    .items([
      S.listItem()
        .title("About")
        .id("about")
        .child(
          S.document()
            .schemaType("aboutPage")
            .documentId(ABOUT_PAGE_DOCUMENT_ID),
        ),
      S.divider(),
      S.documentTypeListItem("libraryItem").title("Library items"),
      S.documentTypeListItem("project").title("Projects"),
      S.documentTypeListItem("tag").title("Tags"),
    ]);
