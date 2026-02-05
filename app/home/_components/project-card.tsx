import { MdOpenInNew } from 'react-icons/md'
import Link from 'next/link'
import { ProjectStatus } from '@prisma/client'
import { statusConfig } from './status-config'
import { ProjectActionsMenu } from './project-actions-menu'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProjectCardProps {
  id: string
  name: string
  description: string
  status: ProjectStatus
  updatedAt: string
  publicUrl?: string | null
}


export function ProjectCard({
  id,
  name,
  description,
  status,
  updatedAt,
  publicUrl,
}: ProjectCardProps) {
  const config = statusConfig[status]
  const initial = name.charAt(0).toUpperCase()

  // Handle open project button - open sandbox publicUrl in new tab
  const handleOpenProject = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (publicUrl) {
      window.open(publicUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Link href={`/projects/${id}`} className="block">
      <Card
      className={cn(
        'group border-border rounded-xl overflow-hidden',
        'hover:border-primary/50 transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5',
        'flex flex-col h-full',
        'gap-0 p-0 shadow-none',
        'text-inherit'
      )}
    >
      {/* Card Header */}
      <CardHeader
        className={cn(
          'h-32 bg-gradient-to-br from-sidebar to-background',
          'relative p-5 flex flex-col justify-between',
          'border-b border-border',
          'group-hover:border-primary/20 transition-colors'
        )}
      >
        {/* More dropdown */}
        <ProjectActionsMenu
          projectId={id}
          projectName={name}
          status={status}
        />

        {/* Initial Avatar */}
        <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center border border-white/5 shadow-inner">
          <span className="text-xl font-bold text-white">{initial}</span>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={cn(
              'text-lg font-bold font-display text-white',
              'group-hover:text-primary transition-colors'
            )}
          >
            {name}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>

        {/* Card Footer */}
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className="relative flex h-2.5 w-2.5">
            {status === 'RUNNING' && (
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  config.bg
                )}
              />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-2.5 w-2.5',
                config.bg,
                config.animate
              )}
            />
          </div>
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">• {updatedAt}</span>
        </div>

        {/* Open button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={handleOpenProject}
          disabled={!publicUrl}
          title={publicUrl ? "Open Project" : "No public URL available"}
        >
          <MdOpenInNew className="w-5 h-5" />
        </Button>
      </div>
      </CardContent>
    </Card>
    </Link>
  )
}
