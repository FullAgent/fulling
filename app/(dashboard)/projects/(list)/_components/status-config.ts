import type { ProjectDisplayStatus } from '@/lib/util/project-display-status'

export interface StatusConfigItem {
  color: string
  bg: string
  label: string
  animate?: string
}

export const statusConfig: Record<ProjectDisplayStatus, StatusConfigItem> = {
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
  IMPORTING: {
    color: 'text-sky-400',
    bg: 'bg-sky-400',
    label: 'Importing',
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
  NEEDS_ATTENTION: {
    color: 'text-amber-400',
    bg: 'bg-amber-400',
    label: 'Needs Attention',
  },
}
