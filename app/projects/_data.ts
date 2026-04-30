export type Track = {
  num: string;
  title: string;
  duration: string;
  /** Sanity CDN URL when an audio file is attached */
  audioUrl?: string | null;
};

export type Credit = {
  name: string;
  roles: string;
};

export type ListenLink = {
  label: string;
  href?: string;
};

export type InspirationItem = {
  /** Matches `LibraryItem.id` in `app/library/_data.ts` */
  libraryItemId: string;
};

/** Toggles for sections in the project detail panel (mirrors Sanity `modules`). */
export type ProjectModules = {
  showArtwork: boolean;
  showAbout: boolean;
  showTracklist: boolean;
  showCredits: boolean;
  showListen: boolean;
  showInspiration: boolean;
};

export const defaultProjectModules: ProjectModules = {
  showArtwork: true,
  showAbout: true,
  showTracklist: true,
  showCredits: true,
  showListen: true,
  showInspiration: true,
};

export type Project = {
  id: string;
  year: string;
  artist: string;
  title: string;
  modules: ProjectModules;
  artwork?: { src: string; alt: string };
  about: string[];
  tracklist: Track[];
  credits: Credit[];
  listen: ListenLink[];
  inspiration: InspirationItem[];
};

const heavenHere: Omit<Project, "id" | "year"> = {
  modules: defaultProjectModules,
  artist: "NOAH GERSH",
  title: "HEAVEN HERE",
  artwork: { src: "/img/heaven-here.jpg", alt: "HEAVEN HERE artwork" },
  about: [
    "First it was For Emma, Forever Ago. The soul in a refraction of icicles. A moment hanging like breath on air. And yet life \u2013 even still life \u2013 is not still. The story is not a story if it does not unravel. Your eyes you may cast backward, but the heart is locked in the chest and must beat forever forward. Bon Iver, Bon Iver is the frozen beast pressing upward from a loosening earth, one ear cocked to the echo of the ghost choir still singing, the other craving the martial call of drums tumbling, of thrum and wheeze. The desolation smoke has dissipated, cut with strips of brass. Celebration will not be denied, the cabinet cannot contain the rattle, there is meat on the bones.",
    "It\u2019s there right away, in the thicker-stringed guitar and military snare of \u201cPerth,\u201d and \u201cMinnesota, WI.\u201d Anyone who had a single listen to For Emma will peg Justin Vernon\u2019s vocals immediately, but there is a sturdiness \u2013 an insistence \u2013 to Bon Iver, Bon Iver that allows him to escape the cabin in the woods without burning it to the ground. \u201cHolocene\u201d opens with simple finger-picking. The vocal is regret spun hollow and strung on a wire. Then the snare-beat breaks and drives us forward and up and up until we fly silent through the black-star night, our wreckage in view whole atmospheres below. The vocals in \u201cHinnom, TX\u201d ease to the muffled depths, while the instrumentation remains sparse and cosmic. \u201cCalgary\u201d is a worship song to everything For Emma mourned, and at the point in the final track \u201cBeth/Rest\u201d when Vernon sings, \u201cI ain\u2019t livin\u2019 in the dark no more\u201d it is clear he isn\u2019t dancing in the sunshine, but rather shading toward a new light.",
  ],
  tracklist: [
    { num: "01", title: "PATHBREAKER", duration: "5:49" },
    { num: "02", title: "TECHE", duration: "3:20" },
    { num: "03", title: "HIGH WATER 1973", duration: "3:30" },
  ],
  credits: [
    { name: "NOAH GERSH", roles: "COMPOSER, PRODUCER, ENGINEER, MIXER, PERFORMER" },
    { name: "BENJAMIN GORDON", roles: "SPIRITUAL GUIDE, ENGINEER" },
    { name: "BIGGIE SMALLS", roles: "EMOTIONAL SUPPORT" },
    { name: "BUDDY GERSH", roles: "ENGINEER, SOURCE INSPIRATION" },
  ],
  listen: [
    { label: "SPOTIFY" },
    { label: "APPLE MUSIC" },
    { label: "AMAZON MUSIC" },
    { label: "YOUTUBE MUSIC" },
    { label: "DIRECT" },
  ],
  inspiration: [
    { libraryItemId: "img-1166" },
    { libraryItemId: "honey-i-feeling-final" },
    { libraryItemId: "img-1270" },
  ],
};

const ecotone: Omit<Project, "id" | "year"> = {
  ...heavenHere,
  title: "ECOTONE",
  artwork: { src: "/img/ecotone.jpeg", alt: "ECOTONE artwork" },
  inspiration: [
    { libraryItemId: "img-9541" },
    { libraryItemId: "archive-still-01" },
    { libraryItemId: "img-1640" },
  ],
};

export const projects: Project[] = [
  { id: "heaven-here-2025", year: "2025", ...heavenHere },
  { id: "ecotone-2024", year: "2024", ...ecotone },
];
