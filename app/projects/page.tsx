import { getLibraryItems, getProjects } from "@/lib/sanity/load";
import ProjectsList from "./_components/projects-list";

/** Always fetch fresh projects on each request (avoids stale prerender after CMS / deploy changes). */
export const revalidate = 0;

export default async function ProjectsPage() {
  const [projects, libraryItems] = await Promise.all([
    getProjects(),
    getLibraryItems(),
  ]);

  return <ProjectsList projects={projects} libraryItems={libraryItems} />;
}
