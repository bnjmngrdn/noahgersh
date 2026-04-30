import { getLibraryItems, getProjects } from "@/lib/sanity/load";
import ProjectRow from "./_components/project-row";

/** Always fetch fresh projects on each request (avoids stale prerender after CMS / deploy changes). */
export const revalidate = 0;

export default async function ProjectsPage() {
  const [projects, libraryItems] = await Promise.all([
    getProjects(),
    getLibraryItems(),
  ]);

  return (
    <div className="w-full pb-13">
      {projects.map((project) => (
        <ProjectRow
          key={project.id}
          project={project}
          libraryItems={libraryItems}
        />
      ))}
    </div>
  );
}
