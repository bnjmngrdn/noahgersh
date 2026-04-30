"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "ABOUT", href: "/about" },
  { label: "PROJECTS", href: "/projects" },
  { label: "LIBRARY", href: "/library" },
  { label: "CONTACT", href: "/contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/studio")) return null;

  const transparent = pathname.startsWith("/library");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 flex items-center justify-between px-8 pt-5 pb-4 text-[11px] font-medium ${
        transparent ? "bg-transparent" : "bg-white"
      }`}
      style={{ viewTransitionName: "site-header" }}
    >
      <Link
        href="/"
        className="tracking-[0.02em] text-black"
      >
        NOAH GERSH
      </Link>
      <nav className="flex items-center gap-6 tracking-[0.02em]">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "text-black"
                  : "text-black/30 hover:text-black/60 transition-colors"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
