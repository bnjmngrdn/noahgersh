"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { Project } from "../projects/_data";
import { NAV_CENTER_CONTROL_WIDTH_CLASS } from "./nav-center-control";

export type ArtistFilter = "all" | "noah-gersh" | "other";

const NOAH_GERSH_ARTIST = "NOAH GERSH";

export const ARTIST_FILTER_OPTIONS: { value: ArtistFilter; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "noah-gersh", label: "NOAH GERSH" },
  { value: "other", label: "OTHER" },
];

type ProjectsFilterContextValue = {
  filter: ArtistFilter;
  setFilter: (next: ArtistFilter) => void;
};

const ProjectsFilterContext = createContext<ProjectsFilterContextValue | null>(
  null,
);

export function ProjectsFilterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [filter, setFilterState] = useState<ArtistFilter>("all");

  useEffect(() => {
    if (!pathname.startsWith("/projects")) {
      setFilterState("all");
    }
  }, [pathname]);

  const setFilter = useCallback((next: ArtistFilter) => {
    setFilterState(next);
  }, []);

  return (
    <ProjectsFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </ProjectsFilterContext.Provider>
  );
}

export function useProjectsFilter(): ProjectsFilterContextValue {
  const ctx = useContext(ProjectsFilterContext);
  if (!ctx) {
    throw new Error(
      "useProjectsFilter must be used within ProjectsFilterProvider",
    );
  }
  return ctx;
}

function normalizeArtist(artist: string): string {
  return artist.trim().toUpperCase();
}

export function matchesArtistFilter(
  project: Project,
  filter: ArtistFilter,
): boolean {
  const artist = normalizeArtist(project.artist);
  if (filter === "all") return true;
  if (filter === "noah-gersh") return artist === NOAH_GERSH_ARTIST;
  return artist !== NOAH_GERSH_ARTIST;
}

export function ProjectsArtistFilter({ className = "" }: { className?: string }) {
  const { filter, setFilter } = useProjectsFilter();

  return (
    <div
      className={`flex items-center justify-center gap-3 tracking-[0.02em] ${NAV_CENTER_CONTROL_WIDTH_CLASS} ${className}`}
      aria-label="Filter projects by artist"
    >
      {ARTIST_FILTER_OPTIONS.map((option, index) => {
        const active = filter === option.value;
        return (
          <span key={option.value} className="flex items-center gap-3">
            {index > 0 ? (
              <span className="text-black/20" aria-hidden>
                |
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setFilter(option.value)}
              className={
                active
                  ? "text-black"
                  : "text-black/30 transition-colors hover:text-black/60"
              }
              aria-pressed={active}
            >
              {option.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
