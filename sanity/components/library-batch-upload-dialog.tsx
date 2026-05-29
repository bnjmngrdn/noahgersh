"use client";

import { UploadIcon } from "@sanity/icons";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Label,
  Stack,
  Text,
  useToast,
} from "@sanity/ui";
import { useCallback, useEffect, useId, useState, type ChangeEvent } from "react";
import { useClient } from "sanity";
import { collectBatchUploadFiles } from "../lib/batch-upload-files";
import { titleFromFilename, uniqueLibrarySlug } from "../lib/unique-library-slug";

type TagOption = { _id: string; title: string };

type Props = {
  open: boolean;
  onClose: () => void;
};

export function LibraryBatchUploadDialog({ open, onClose }: Props) {
  const client = useClient({ apiVersion: "2025-01-01" });
  const toast = useToast();
  const inputId = useId();
  const [tags, setTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    client
      .fetch<TagOption[]>(
        `*[_type == "tag"] | order(title asc) { _id, title }`,
      )
      .then((rows) => {
        if (!cancelled) setTags(rows);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      });
    return () => {
      cancelled = true;
    };
  }, [client, open]);

  const reset = useCallback(() => {
    setFiles([]);
    setSelectedTagIds([]);
    setProgress("");
    setUploading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (uploading) return;
    reset();
    onClose();
  }, [onClose, reset, uploading]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const list = event.target.files;
      if (!list?.length) {
        setFiles([]);
        return;
      }
      try {
        const collected = await collectBatchUploadFiles(list);
        setFiles(collected);
        if (collected.length === 0) {
          toast.push({
            status: "warning",
            title: "No media files found",
            description: "Choose images, video, audio, or a .zip containing them.",
          });
        }
      } catch {
        toast.push({
          status: "error",
          title: "Could not read files",
        });
      }
      event.target.value = "";
    },
    [toast],
  );

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }, []);

  const handleUpload = useCallback(async () => {
    if (!files.length || uploading) return;

    setUploading(true);
    const tagRefs = selectedTagIds.map((id) => ({
      _type: "reference" as const,
      _key: id,
      _ref: id,
    }));

    let created = 0;
    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}…`);

        const title = titleFromFilename(file.name);
        const slug = await uniqueLibrarySlug(client, title);
        const asset = await client.assets.upload("file", file, {
          filename: file.name,
        });

        await client.create({
          _type: "libraryItem",
          title,
          slug: { _type: "slug", current: slug },
          description: "",
          showOnHomepage: false,
          mediaSource: "upload",
          media: {
            _type: "file",
            asset: { _type: "reference", _ref: asset._id },
          },
          ...(tagRefs.length > 0 ? { tags: tagRefs } : {}),
        });
        created += 1;
      }

      toast.push({
        status: "success",
        title:
          created === 1
            ? "1 library item created"
            : `${created} library items created`,
      });
      reset();
      onClose();
    } catch (err) {
      toast.push({
        status: "error",
        title: "Batch upload failed",
        description: err instanceof Error ? err.message : "Try again.",
      });
      setUploading(false);
      setProgress("");
    }
  }, [client, files, onClose, reset, selectedTagIds, toast, uploading]);

  if (!open) return null;

  return (
    <Dialog
      id="library-batch-upload"
      header="Batch upload library"
      onClose={handleClose}
      width={1}
      zOffset={1000}
    >
      <Box padding={4}>
        <Stack space={5}>
          <Stack space={3}>
            <Text size={1} muted>
              Upload images, video, audio, or a .zip folder. Each file becomes one
              library item titled from the filename — no homepage flag, no
              description.
            </Text>
            <Flex gap={3} align="center">
              <Button
                as="label"
                htmlFor={inputId}
                icon={UploadIcon}
                text="Choose files"
                mode="ghost"
                disabled={uploading}
              />
              <input
                id={inputId}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.zip,application/zip"
                hidden
                onChange={handleFileChange}
              />
              <Text size={1} muted>
                {files.length
                  ? `${files.length} file${files.length === 1 ? "" : "s"} ready`
                  : "No files selected"}
              </Text>
            </Flex>
          </Stack>

          {tags.length > 0 ? (
            <Stack space={3}>
              <Label size={1}>Tags for this batch (optional)</Label>
              <Card border padding={3} radius={2}>
                <Stack space={3}>
                  {tags.map((tag) => (
                    <Flex key={tag._id} align="center" gap={3}>
                      <Checkbox
                        checked={selectedTagIds.includes(tag._id)}
                        onChange={() => toggleTag(tag._id)}
                        disabled={uploading}
                      />
                      <Text size={1}>{tag.title}</Text>
                    </Flex>
                  ))}
                </Stack>
              </Card>
            </Stack>
          ) : null}

          {progress ? (
            <Text size={1} muted>
              {progress}
            </Text>
          ) : null}

          <Flex gap={3} justify="flex-end">
            <Button
              text="Cancel"
              mode="bleed"
              onClick={handleClose}
              disabled={uploading}
            />
            <Button
              text={uploading ? "Uploading…" : "Upload"}
              tone="primary"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  );
}
