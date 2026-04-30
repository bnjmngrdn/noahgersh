export const libraryQuery = /* groq */ `
  *[_type == "libraryItem" && defined(slug.current) && !(_id in path("drafts.**"))] | order(_createdAt asc) {
    "id": slug.current,
    title,
    "mime": coalesce(media.asset->mimeType, image.asset->mimeType, videoFile.asset->mimeType, audioFile.asset->mimeType),
    "src": coalesce(media.asset->url, image.asset->url, videoFile.asset->url, audioFile.asset->url),
    "type": select(
      defined(media.asset) => select(
        string::startsWith(coalesce(media.asset->mimeType, ""), "image/") => "image",
        string::startsWith(coalesce(media.asset->mimeType, ""), "video/") => "video",
        string::startsWith(coalesce(media.asset->mimeType, ""), "audio/") => "audio",
        "image"
      ),
      defined(image.asset) => "image",
      defined(videoFile.asset) => "video",
      defined(audioFile.asset) => "audio",
      "image"
    ),
    "alt": coalesce(alt, image.alt),
    description,
    "tags": coalesce(tags[]->title, [])
  }
`;

export const projectsQuery = /* groq */ `
  *[_type == "project" && !(_id in path("drafts.**"))] | order(year desc) {
    "id": slug.current,
    "sanityDocumentId": _id,
    year,
    artist,
    title,
    "artwork": select(
      defined(artwork.asset) => {
        "src": artwork.asset->url,
        "alt": coalesce(artwork.alt, "")
      }
    ),
    "modules": {
      "showArtwork": coalesce(modules.showArtwork, true),
      "showAbout": coalesce(modules.showAbout, true),
      "showTracklist": coalesce(modules.showTracklist, true),
      "showCredits": coalesce(modules.showCredits, true),
      "showListen": coalesce(modules.showListen, true),
      "showInspiration": coalesce(modules.showInspiration, true)
    },
    about,
    "tracklist": coalesce(
      tracklist[]{
        num,
        title,
        duration,
        "audioUrl": audioFile.asset->url
      },
      []
    ),
    "credits": coalesce(credits, []),
    "listen": coalesce(listen, []),
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
