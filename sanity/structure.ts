import type { StructureResolver } from "sanity/structure";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { ABOUT_PAGE_DOCUMENT_ID } from "./constants";
import { libraryDocumentListDeskItem } from "./library-document-list-desk-item";

export const structure: StructureResolver = (S, context) =>
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
      libraryDocumentListDeskItem({ S, context }),
      orderableDocumentListDeskItem({
        type: "project",
        title: "Projects",
        S,
        context,
      }),
      S.documentTypeListItem("tag").title("Tags"),
    ]);
