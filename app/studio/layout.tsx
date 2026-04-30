import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextStudioLayout } from "next-sanity/studio";
import "./studio-fonts.css";

export const metadata: Metadata = {
  title: "Studio · Noah Gersh",
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

/** Light chrome + site typography (see `studio-fonts.css` + `sanity/studio-theme.ts`). */
const studioChromeClass =
  "studio-root min-h-dvh bg-white text-black antialiased";

export default function StudioRootLayout({ children }: { children: ReactNode }) {
  return (
    <NextStudioLayout>
      <div className={studioChromeClass}>{children}</div>
    </NextStudioLayout>
  );
}
