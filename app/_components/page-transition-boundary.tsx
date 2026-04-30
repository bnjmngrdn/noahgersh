"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/** Space for fixed header + notch (library uses full-bleed under transparent header). */
function contentTopPadClass(pathname: string): string {
  if (pathname.startsWith("/studio") || pathname.startsWith("/library")) return "";
  return "pt-[max(3.75rem,env(safe-area-inset-top,0px)+2.75rem)]";
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
      <div className="flex min-h-screen w-full flex-1 flex-col">{children}</div>
    );
  }

  const topPad = contentTopPadClass(pathname);

  return (
    <ViewTransition>
      <div
        className={`flex w-full flex-1 flex-col ${topPad}`}
        style={{ viewTransitionName: "page-content" }}
      >
        {children}
      </div>
    </ViewTransition>
  );
}
