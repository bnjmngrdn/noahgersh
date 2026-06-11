const libraryItemFields = /* groq */ `
  "id": slug.current,
  title,
  "mediaSource": coalesce(mediaSource, "upload"),
  "youtubeUrl": youtubeUrl,
  "mime": coalesce(media.asset->mimeType, image.asset->mimeType, videoFile.asset->mimeType, audioFile.asset->mimeType),
  "src": coalesce(image.asset->url, media.asset->url, videoFile.asset->url, audioFile.asset->url),
  "imageSource": select(defined(image.asset) => image),
  "type": select(
    coalesce(mediaSource, "upload") == "youtube" => "youtube",
    defined(image.asset) => "image",
    defined(media.asset) => select(
      string::startsWith(coalesce(media.asset->mimeType, ""), "image/") => "image",
      string::startsWith(coalesce(media.asset->mimeType, ""), "video/") => "video",
      string::startsWith(coalesce(media.asset->mimeType, ""), "audio/") => "audio",
      "image"
    ),
    defined(videoFile.asset) => "video",
    defined(audioFile.asset) => "audio",
    "image"
  ),
  "alt": coalesce(image.alt, image.asset->altText),
  description,
  "tags": coalesce(tags[]->title, []),
  "createdAt": _createdAt,
  "showOnHomepage": coalesce(showOnHomepage, false)
`;

export const libraryQuery = /* groq */ `
  *[_type == "libraryItem" && defined(slug.current) && !(_id in path("drafts.**"))] | order(_createdAt asc) {
    ${libraryItemFields}
  }
`;

export const homepageFeedQuery = /* groq */ `
  *[_type == "libraryItem" && showOnHomepage == true && defined(slug.current) && !(_id in path("drafts.**"))] | order(_createdAt desc) {
    ${libraryItemFields}
  }
`;

export const projectsQuery = /* groq */ `
  *[_type == "project" && !(_id in path("drafts.**"))] | order(orderRank asc, year desc) {
    "id": slug.current,
    "sanityDocumentId": _id,
    orderRank,
    year,
    artist,
    title,
    "artwork": select(
      defined(artwork.asset) => {
        "src": artwork.asset->url,
        "alt": coalesce(artwork.alt, ""),
        "imageSource": artwork
      }
    ),
    "modules": {
      "showArtwork": coalesce(modules.showArtwork, true),
      "showAbout": coalesce(modules.showAbout, true),
      "showTracklist": coalesce(modules.showTracklist, true),
      "showCredits": coalesce(modules.showCredits, true),
      "showInspiration": coalesce(modules.showInspiration, true)
    },
    about,
    "tracklist": coalesce(
      tracklist[]{
        num,
        title,
        duration,
        lyrics,
        "audioUrl": audioFile.asset->url
      },
      []
    ),
    "credits": coalesce(credits, []),
    "inspiration": coalesce(
      inspiration[]->{
        "libraryItemId": slug.current
      },
      []
    )
  }
`;

export const aboutQuery = /* groq */ `
  *[_type == "aboutPage" && !(_id in path("drafts.**"))][0]{
    body
  }
`;