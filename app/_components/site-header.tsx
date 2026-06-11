"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MiniAudioPlayer from "./mini-audio-player";
import { ProjectsArtistFilter } from "./projects-artist-filter";
import { LibrarySearchInput } from "./library-search";

const NAV_ITEMS = [
  { label: "ABOUT", href: "/about" },
  { label: "PROJECTS", href: "/projects" },
  { label: "LIBRARY", href: "/library" },
];

const linkClass = (active: boolean) =>
  active
    ? "text-black"
    : "text-black/30 hover:text-black/60 transition-colors";

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isStudio = pathname.startsWith("/studio");

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMenuOpen((wasOpen) => (wasOpen ? false : wasOpen));
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  if (isStudio) return null;

  const isProjects = pathname.startsWith("/projects");
  const isLibrary = pathname.startsWith("/library");
  const isProjectsOrLibrary = isProjects || isLibrary;
  const showLibraryMobileSearch = isLibrary && !menuOpen;
  const headerBorder =
    menuOpen || isProjectsOrLibrary ? "border-b border-black/15" : "";

  return (
    <>
      {!menuOpen ? (
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-x-0 top-0 z-[25] bg-gradient-to-b from-white to-white/0 ${
            showLibraryMobileSearch
              ? "h-[var(--site-header-height-library-mobile)] md:h-[var(--site-header-height)]"
              : "h-[var(--site-header-height)]"
          }`}
        />
      ) : null}
      <header
        className={`fixed inset-x-0 top-0 z-30 flex bg-white px-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-[11px] font-medium sm:px-8 ${
          showLibraryMobileSearch
            ? "flex-col gap-2 pb-3 md:flex-row md:items-center md:justify-between md:gap-0 md:pb-4"
            : "flex-row items-center justify-between pb-4"
        } ${headerBorder}`}
        style={{ viewTransitionName: "site-header" }}
      >
        <div className="flex w-full items-center justify-between md:contents">
          <div className="box-border flex min-w-0 items-center gap-2 sm:gap-3 md:w-[calc(222px-2rem)] md:shrink-0">
            <Link
              href="/"
              className="shrink-0 tracking-[0.02em] text-black"
              onClick={() => setMenuOpen(false)}
            >
              NOAH GERSH
            </Link>
            {!isLibrary ? <MiniAudioPlayer /> : null}
          </div>

          {isProjects && !menuOpen ? (
            <div className="pointer-events-none absolute inset-x-0 hidden justify-center md:flex">
              <ProjectsArtistFilter className="pointer-events-auto" />
            </div>
          ) : null}

          {isLibrary && !menuOpen ? (
            <div className="pointer-events-none absolute inset-x-0 hidden justify-center md:flex">
              <LibrarySearchInput className="pointer-events-auto" />
            </div>
          ) : null}

          <div className="flex shrink-0 items-center justify-end gap-4 md:gap-6 md:flex-1">
            <nav
              className="hidden items-center gap-6 tracking-[0.02em] md:flex"
              aria-label="Primary"
            >
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={linkClass(active)}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              className="-mr-2 flex min-h-11 min-w-11 items-center justify-center uppercase tracking-[0.02em] text-black/70 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-mobile-nav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {showLibraryMobileSearch ? (
          <div className="w-full md:hidden">
            <LibrarySearchInput className="max-w-none" />
          </div>
        ) : null}
      </header>

      {/* Mobile nav panel — below header, same type scale as desktop */}
      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-black/10 md:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="site-mobile-nav"
            className="fixed inset-x-0 z-20 flex flex-col border-b border-black/15 bg-white px-4 pb-6 pt-[max(4.25rem,env(safe-area-inset-top,0px)+3rem)] md:hidden"
            role="dialog"
            aria-label="Menu"
          >
          <nav className="flex flex-col gap-1 tracking-[0.02em]" aria-label="Mobile primary">
            {isProjects ? (
              <div className="pb-2">
                <ProjectsArtistFilter />
              </div>
            ) : null}
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center text-[12px] font-medium uppercase ${linkClass(active)}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          </div>
        </>
      ) : null}
    </>
  );
}
