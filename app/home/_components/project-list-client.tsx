import { ProjectCard } from './project-card'
import { CreateProjectCard } from './create-project-card'
import { Project, ProjectStatus } from './types'

// Prisma Project type (from getProjects)
interface PrismaProject {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  updatedAt: Date
}

interface ProjectListClientProps {
  projects: PrismaProject[]
  activeFilter: 'ALL' | ProjectStatus
}

// Helper: Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function ProjectListClient({ projects, activeFilter }: ProjectListClientProps) {
  // Map to frontend format
  const mappedProjects: Project[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || 'No description',
    status: p.status,
    updatedAt: formatRelativeTime(p.updatedAt),
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
