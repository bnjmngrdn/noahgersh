import { UploadIcon } from "@sanity/icons";
import type {
  StructureBuilder,
  StructureResolverContext,
} from "sanity/structure";
import { LibraryItemsPane } from "./components/library-items-pane";

export function libraryDocumentListDeskItem({
  S,
  context,
}: {
  S: StructureBuilder;
  context: StructureResolverContext;
}) {
  const type = "libraryItem";
  const typeTitle = context.schema.get(type)?.title ?? "Library item";

  return S.listItem()
    .title("Library items")
    .schemaType(type)
    .child(
      Object.assign(
        S.documentTypeList(type)
          .canHandleIntent((_intentName, params) => params?.type === type)
          .serialize(),
        {
        __preserveInstance: true,
        key: "library-items",
        type: "component",
        component: LibraryItemsPane,
        options: { type },
        menuItems: [
          S.menuItem()
            .title("Batch upload")
            .icon(UploadIcon)
            .showAsAction(true)
            .action("batchUpload")
            .serialize(),
          S.menuItem()
            .title(`Create new ${typeTitle}`)
            .intent({ type: "create", params: { type } })
            .serialize(),
        ],
      }),
    );
}
