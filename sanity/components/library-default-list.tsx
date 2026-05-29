"use client";

import { TrashIcon } from "@sanity/icons";
import { Box, Button, Card, Flex, Spinner, Stack, Text, Tooltip } from "@sanity/ui";
import { useCallback, useMemo, useState } from "react";
import {
  Preview,
  PreviewCard,
  useDocumentVersionInfo,
  useDocumentOperation,
  useEditState,
  useSchema,
  DocumentStatusIndicator,
} from "sanity";
import { useListeningQuery } from "sanity-plugin-utils";
import { ConfirmDeleteDialog, usePaneRouter } from "sanity/structure";

type LibraryDoc = {
  _id: string;
  _type: string;
  title?: string;
};

function LibraryDocumentDeleteButton({
  docId,
  docType,
}: {
  docId: string;
  docType: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { delete: deleteOp } = useDocumentOperation(docId, docType);
  const { draft } = useEditState(docId, docType);
  const confirmId = draft?._id ?? docId;

  const handleConfirm = useCallback(
    (versions: string[]) => {
      setConfirmOpen(false);
      setIsDeleting(true);
      deleteOp.execute(versions);
      setIsDeleting(false);
    },
    [deleteOp],
  );

  return (
    <>
      <Tooltip content="Delete" portal>
        <Button
          icon={TrashIcon}
          mode="bleed"
          tone="critical"
          aria-label="Delete"
          disabled={Boolean(deleteOp.disabled) || isDeleting}
          onClick={() => setConfirmOpen(true)}
        />
      </Tooltip>
      {confirmOpen ? (
        <ConfirmDeleteDialog
          action="delete"
          id={confirmId}
          type={docType}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}

function LibraryDocumentRow({ doc }: { doc: LibraryDoc }) {
  const schema = useSchema();
  const schemaType = schema.get(doc._type);
  const router = usePaneRouter();
  const versionsInfo = useDocumentVersionInfo(doc._id);
  const { ChildLink, groupIndex, routerPanesState } = router;
  const currentDoc = routerPanesState[groupIndex + 1]?.[0]?.id || false;
  const pressed =
    currentDoc === doc._id || currentDoc === doc._id.replace("drafts.", "");
  const selected =
    pressed && routerPanesState.length === groupIndex + 2;

  const Link = useMemo(
    () =>
      function LibraryDocLink(linkProps: Record<string, unknown>) {
        return <ChildLink {...linkProps} childId={doc._id} />;
      },
    [ChildLink, doc._id],
  );

  if (!schemaType) return null;

  return (
    <Card paddingBottom={1}>
      <Flex align="center" gap={1}>
        <Box flex={1} style={{ minWidth: 0 }}>
          <PreviewCard
            __unstable_focusRing
            // PreviewCard `as` expects a string tag union; ChildLink wrapper is valid at runtime.
            {...({ as: Link } as object)}
            data-as="a"
            data-ui="PaneItem"
            radius={2}
            pressed={selected}
            selected={selected}
            sizing="border"
            tabIndex={-1}
            tone="inherit"
            width="100%"
          >
            <Flex align="center" justify="space-between" paddingRight={3}>
              <Preview layout="default" value={doc} schemaType={schemaType} />
              <DocumentStatusIndicator
                draft={versionsInfo.draft}
                published={versionsInfo.published}
                versions={versionsInfo.versions}
              />
            </Flex>
          </PreviewCard>
        </Box>
        <Box paddingRight={1} style={{ flexShrink: 0 }}>
          <LibraryDocumentDeleteButton docId={doc._id} docType={doc._type} />
        </Box>
      </Flex>
    </Card>
  );
}

export function LibraryDefaultList({ type }: { type: string }) {
  const query = `*[_type == $type && !(_id in path("drafts.**"))] | order(_createdAt desc) {
    _id,
    _type,
    title,
    description,
    showOnHomepage,
    mediaSource
  }`;

  const { data, loading, error } = useListeningQuery<LibraryDoc[]>(query, {
    params: { type },
    initialValue: [] as LibraryDoc[],
  });

  if (loading) {
    return (
      <Flex align="center" justify="center" height="fill" padding={5}>
        <Spinner />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box padding={4}>
        <Text size={1}>Could not load library items.</Text>
      </Box>
    );
  }

  const docs: LibraryDoc[] = Array.isArray(data) ? data : [];

  if (docs.length === 0) {
    return (
      <Flex align="center" direction="column" height="fill" justify="center">
        <Box padding={5}>
          <Text align="center" muted size={1}>
            No library items yet
          </Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Stack space={1} padding={2} style={{ overflow: "auto", height: "100%" }}>
      {docs.map((doc) => (
        <LibraryDocumentRow key={doc._id} doc={doc} />
      ))}
    </Stack>
  );
}
