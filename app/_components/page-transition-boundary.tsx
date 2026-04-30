"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

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

  return (
    <ViewTransition>
      <div
        className="flex w-full flex-1 flex-col"
        style={{ viewTransitionName: "page-content" }}
      >
        {children}
      </div>
    </ViewTransition>
  );
}
