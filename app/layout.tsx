import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AudioPlaybackProvider } from "./_components/audio-playback-provider";
import SiteHeader from "./_components/site-header";
import PageTransitionBoundary from "./_components/page-transition-boundary";

const neueMontreal = localFont({
  variable: "--font-neue-montreal",
  display: "swap",
  src: [
    { path: "../public/fonts/ppneuemontreal-thin.otf", weight: "100", style: "normal" },
    { path: "../public/fonts/ppneuemontreal-book.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/ppneuemontreal-italic.otf", weight: "400", style: "italic" },
    { path: "../public/fonts/ppneuemontreal-medium.otf", weight: "500", style: "normal" },
    { path: "../public/fonts/ppneuemontreal-semibolditalic.otf", weight: "600", style: "italic" },
    { path: "../public/fonts/ppneuemontreal-bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Noah Gersh",
  description: "Noah Gersh",
  other: {
    "build-sha": process.env.COMMIT_REF ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${neueMontreal.variable} h-full antialiased`}
    >
      <body className="min-h-dvh font-sans text-[12px] leading-[1.45] text-black">
        <AudioPlaybackProvider>
          <SiteHeader />
          <main className="flex min-h-dvh w-full flex-col">
            <PageTransitionBoundary>{children}</PageTransitionBoundary>
          </main>
        </AudioPlaybackProvider>
      </body>
    </html>
  );
}
