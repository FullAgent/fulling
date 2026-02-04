import { MdMoreHoriz, MdOpenInNew } from 'react-icons/md'
import { ProjectStatus } from './types'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  id: string
  name: string
  description: string
  status: ProjectStatus
  updatedAt: string
}

const statusConfig: Record<
  ProjectStatus,
  { color: string; bg: string; label: string; animate?: string }
> = {
  // Stable states
  RUNNING: {
    color: 'text-emerald-500',
    bg: 'bg-emerald-500',
    label: 'Running',
    animate: 'animate-pulse',
  },
  STOPPED: {
    color: 'text-gray-500',
    bg: 'bg-gray-500',
    label: 'Stopped',
  },
  TERMINATED: {
    color: 'text-gray-600',
    bg: 'bg-gray-600',
    label: 'Terminated',
  },
  // Transition states
  CREATING: {
    color: 'text-yellow-500',
    bg: 'bg-yellow-500',
    label: 'Creating',
    animate: 'animate-pulse',
  },
  UPDATING: {
    color: 'text-blue-500',
    bg: 'bg-blue-500',
    label: 'Updating',
    animate: 'animate-pulse',
  },
  STARTING: {
    color: 'text-cyan-500',
    bg: 'bg-cyan-500',
    label: 'Starting',
    animate: 'animate-pulse',
  },
  STOPPING: {
    color: 'text-orange-500',
    bg: 'bg-orange-500',
    label: 'Stopping',
    animate: 'animate-pulse',
  },
  TERMINATING: {
    color: 'text-red-400',
    bg: 'bg-red-400',
    label: 'Terminating',
    animate: 'animate-pulse',
  },
  // Special states
  ERROR: {
    color: 'text-red-500',
    bg: 'bg-red-500',
    label: 'Error',
  },
  PARTIAL: {
    color: 'text-purple-500',
    bg: 'bg-purple-500',
    label: 'Partial',
  },
}

export function ProjectCard({
  name,
  description,
  status,
  updatedAt,
}: ProjectCardProps) {
  const config = statusConfig[status]
  const initial = name.charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        'group bg-card border border-border rounded-xl overflow-hidden',
        'hover:border-primary/50 transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5',
        'flex flex-col h-full'
      )}
    >
      {/* Card Header */}
      <div
        className={cn(
          'h-32 bg-gradient-to-br from-[#1A1D21] to-[#121416]',
          'relative p-5 flex flex-col justify-between',
          'border-b border-border',
          'group-hover:border-primary/20 transition-colors'
        )}
      >
        {/* More button */}
        <button className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors">
          <MdMoreHoriz className="w-5 h-5" />
        </button>

        {/* Initial Avatar */}
        <div className="w-12 h-12 rounded-lg bg-[#25282e] flex items-center justify-center border border-white/5 shadow-inner">
          <span className="text-xl font-bold text-white">{initial}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-1">
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
          <button
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Open Project"
          >
            <MdOpenInNew className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
