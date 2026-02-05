import { ProjectCard } from './project-card'
import { CreateProjectCard } from './create-project-card'
import { ProjectStatus } from '@prisma/client'
import type { ProjectWithRelations } from '@/lib/data/project'
import { formatRelativeTime } from '@/lib/util/format-time'

interface ProjectListProps {
  projects: ProjectWithRelations<{ sandboxes: true }>[]
  activeFilter: 'ALL' | ProjectStatus
}

export function ProjectList({ projects, activeFilter }: ProjectListProps) {
  // Map to frontend format with sandbox publicUrl
  const mappedProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || 'No description',
    status: p.status,
    updatedAt: formatRelativeTime(p.updatedAt),
    publicUrl: p.sandboxes?.[0]?.publicUrl,
  }))

  const filteredProjects =
    activeFilter === 'ALL'
      ? mappedProjects
      : mappedProjects.filter((p) => p.status === activeFilter)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <ProjectCard key={project.id} {...project} />
      ))}
      <CreateProjectCard />
    </div>
  )
}