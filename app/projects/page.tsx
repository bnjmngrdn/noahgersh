import { getLibraryItems, getProjects } from "@/lib/sanity/load";
import ProjectRow from "./_components/project-row";

export default async function ProjectsPage() {
  const [projects, libraryItems] = await Promise.all([
    getProjects(),
    getLibraryItems(),
  ]);

  return (
    <div className="w-full py-13">
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
