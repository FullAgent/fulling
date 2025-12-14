'use client';


import EmptyProjectCard from '@/components/features/projectList/EmptyProjectCard';
import ProjectCard from '@/components/features/projectList/ProjectCard';
import ProjectCardSkeleton from '@/components/features/projectList/ProjectCardSkeleton';
import { useProjects } from '@/hooks/use-projects';

export default function ProjectListContent() {
  // Fetch projects with automatic polling (every 3 seconds)
  // Namespace is automatically determined from user's kubeconfig
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        <EmptyProjectCard />
      </div>
    </div>
  );
}
