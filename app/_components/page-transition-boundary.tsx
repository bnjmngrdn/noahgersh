"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/** Fixed offset below the site header (matches previous layout; avoids drifting paddings). */
function contentTopPadClass(pathname: string): string {
  if (pathname.startsWith("/studio") || pathname.startsWith("/library")) return "";
  return "pt-[55px]";
}

export default function PageTransitionBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");

  if (isStudio) {
    return (
      <div className="flex min-h-dvh w-full flex-1 flex-col">{children}</div>
    );
  }

  const topPad = contentTopPadClass(pathname);

  return (
    <ViewTransition>
      <div
        className={`flex min-h-0 w-full flex-1 flex-col ${topPad}`}
        style={{ viewTransitionName: "page-content" }}
      >
        {children}
      </div>
    </ViewTransition>
  );
}
