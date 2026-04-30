import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { ABOUT_FALLBACK_PARAGRAPHS } from "@/lib/content/about-fallback-paragraphs";
import { getAboutBody } from "@/lib/sanity/load";

const aboutPortableComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
  },
};

function AboutFallback() {
  return (
    <>
      {ABOUT_FALLBACK_PARAGRAPHS.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </>
  );
}

export default async function AboutPage() {
  const body = await getAboutBody();

  return (
    <div className="my-auto mx-auto w-full max-w-[900px] space-y-4 px-4 sm:px-8">
      {body ? (
        <PortableText value={body} components={aboutPortableComponents} />
      ) : (
        <AboutFallback />
      )}
    </div>
  );
}
