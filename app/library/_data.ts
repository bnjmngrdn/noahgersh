export type LibraryItemCommon = {
  id: string;
  title: string;
  description: string;
  tags: string[];
};

export type LibraryItem =
  | (LibraryItemCommon & {
      type: "image";
      src: string;
      alt?: string;
    })
  | (LibraryItemCommon & {
      type: "video";
      src: string;
      alt?: string;
    })
  | (LibraryItemCommon & {
      type: "audio";
      src: string;
    });

/** Index in `items`, or -1 if unknown id. */
export function getLibraryItemIndexById(items: LibraryItem[], id: string): number {
  return items.findIndex((it) => it.id === id);
}

// Items follow the zigzag column pattern by index; each block opens a lightbox with media, copy, and tags.
export const libraryItems: LibraryItem[] = [
  {
    id: "img-1166",
    type: "image",
    src: "/content/IMG_1166.JPG",
    title: "IMG_1166",
    description: "Still from the reference roll — warm interior, late afternoon.",
    tags: ["photo", "interior", "reference"],
  },
  {
    id: "honey-i-feeling-final",
    type: "audio",
    src: "/content/honey%20i%20feeling%20final.m4a",
    title: "honey i — feeling (final)",
    description: "Final mix pass: full arrangement and vocal treatment.",
    tags: ["audio", "honey i", "mix"],
  },
  {
    id: "img-9541",
    type: "image",
    src: "/content/IMG_9541.jpeg",
    title: "IMG_9541",
    description: "Location texture — grain and color study.",
    tags: ["photo", "texture", "outdoor"],
  },
  {
    id: "img-1270",
    type: "video",
    src: "/content/IMG_1270.MOV",
    title: "IMG_1270",
    description: "Handheld clip: motion and pacing reference for edit.",
    tags: ["video", "reference", "b-roll"],
  },
  {
    id: "img-1673",
    type: "image",
    src: "/content/IMG_1673.JPG",
    title: "IMG_1673",
    description: "Composition note: negative space and horizon line.",
    tags: ["photo", "landscape", "composition"],
  },
  {
    id: "archive-still-01",
    type: "image",
    src: "/content/79737806737__281488A2-C391-4D1A-A200-AD2F20D9AA7F.jpeg",
    title: "Archive still 01",
    description: "Imported from camera roll — palette anchor for the library.",
    tags: ["photo", "archive", "palette"],
  },
  {
    id: "honey-i-chorus-structure",
    type: "audio",
    src: "/content/honey%20i%20chorus%20structure.m4a",
    title: "honey i — chorus structure",
    description: "Early structure sketch: chorus form and lift.",
    tags: ["audio", "honey i", "demo", "chorus"],
  },
  {
    id: "img-1169",
    type: "image",
    src: "/content/IMG_1169.JPG",
    title: "IMG_1169",
    description: "Contrast study — deep shadows, single light source.",
    tags: ["photo", "light", "contrast"],
  },
  {
    id: "img-1674",
    type: "image",
    src: "/content/IMG_1674.PNG",
    title: "IMG_1674",
    description: "Graphic / screen grab — layout or type reference.",
    tags: ["image", "graphic", "layout"],
  },
  {
    id: "img-1640",
    type: "video",
    src: "/content/IMG_1640.MOV",
    title: "IMG_1640",
    description: "Second motion reference — rhythm and cut points.",
    tags: ["video", "reference", "edit"],
  },
  {
    id: "archive-still-02",
    type: "image",
    src: "/content/79737813301__80542F96-06B0-44F6-85FF-70A89D1A1207.jpeg",
    title: "Archive still 02",
    description: "Texture and detail — useful for collage or mood pulls.",
    tags: ["photo", "archive", "detail"],
  },
  {
    id: "img-1694",
    type: "image",
    src: "/content/IMG_1694.JPG",
    title: "IMG_1694",
    description: "Color note — saturation and skin / environment balance.",
    tags: ["photo", "color", "portrait-adjacent"],
  },
  {
    id: "img-8509",
    type: "image",
    src: "/content/IMG_8509.JPG",
    title: "IMG_8509",
    description: "Wide establish — space and scale for visual sequencing.",
    tags: ["photo", "wide", "establish"],
  },
  {
    id: "archive-still-03",
    type: "image",
    src: "/content/79737826464__C2985B28-167C-4D2C-A000-A68B5E2058F9.jpeg",
    title: "Archive still 03",
    description: "Closing frame in the set — tonal and mood bookmark.",
    tags: ["photo", "archive", "mood"],
  },
];
