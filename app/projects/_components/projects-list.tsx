"use client";

import { useMemo } from "react";
import type { LibraryItem } from "../../library/_data";
import type { Project } from "../_data";
import {
  matchesArtistFilter,
  useProjectsFilter,
} from "../../_components/projects-artist-filter";
import ProjectRow from "./project-row";

export default function ProjectsList({
  projects,
  libraryItems,
}: {
  projects: Project[];
  libraryItems: LibraryItem[];
}) {
  const { filter } = useProjectsFilter();

  const visibleProjects = useMemo(
    () => projects.filter((project) => matchesArtistFilter(project, filter)),
    [projects, filter],
  );

  return (
    <div className="w-full pb-13 [&>article:first-child]:border-t-0">
      {visibleProjects.map((project) => (
        <ProjectRow
          key={project.id}
          project={project}
          libraryItems={libraryItems}
        />
      ))}
    </div>
  );
}
