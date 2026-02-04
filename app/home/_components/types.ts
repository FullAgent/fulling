export type ProjectStatus =
  // Stable states
  | 'RUNNING'
  | 'STOPPED'
  | 'TERMINATED'
  // Transition states
  | 'CREATING'
  | 'UPDATING'
  | 'STARTING'
  | 'STOPPING'
  | 'TERMINATING'
  // Special states
  | 'ERROR'
  | 'PARTIAL'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  updatedAt: string
}
