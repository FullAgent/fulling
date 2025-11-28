'use client';


import ProjectCard from '@/components/features/projectList/ProjectCard';
import EmptyProjectCard from '@/components/features/projectList/EmptyProjectCard';
import { Spinner } from '@/components/ui/spinner';
import { useProjects } from '@/hooks/use-projects';

export default function ProjectListContent() {
  // Fetch projects with automatic polling (every 3 seconds)
  // Namespace is automatically determined from user's kubeconfig
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Loading projects...</span>
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
