"use client";

import dynamic from "next/dynamic";

const StudioClient = dynamic(() => import("./studio-client"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center bg-[#101112] text-[12px] text-white/45">
      Loading studio…
    </div>
  ),
});

export default function StudioShell() {
  return <StudioClient />;
}
