import type { ProjectStatus, ProjectTask } from '@prisma/client'

import { getProjectImportStatus } from '@/lib/util/project-import-status'

export type ProjectDisplayStatus =
  | 'CREATING'
  | 'IMPORTING'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'UPDATING'
  | 'TERMINATING'
  | 'ERROR'
  | 'NEEDS_ATTENTION'

type ProjectDisplayStatusInput = {
  status: ProjectStatus
  githubRepoFullName?: string | null
  githubAppInstallationId?: string | null
  tasks?: Pick<ProjectTask, 'type' | 'status' | 'createdAt'>[]
}

export function isImportProject(project: {
  githubRepoFullName?: string | null
  githubAppInstallationId?: string | null
}): boolean {
  return Boolean(project.githubRepoFullName || project.githubAppInstallationId)
}

export function getProjectDisplayStatus(
  project: ProjectDisplayStatusInput
): ProjectDisplayStatus {
  const importProject = isImportProject(project)
  const importStatus = getProjectImportStatus({ tasks: project.tasks })

  if (importStatus === 'IMPORT_FAILED') {
    return 'NEEDS_ATTENTION'
  }

  if (project.status === 'ERROR') {
    return 'ERROR'
  }

  if (project.status === 'TERMINATING') {
    return 'TERMINATING'
  }

  if (project.status === 'STOPPING') {
    return 'STOPPING'
  }

  if (project.status === 'STOPPED') {
    return 'STOPPED'
  }

  if (project.status === 'UPDATING') {
    return 'UPDATING'
  }

  if (importProject && importStatus === 'IMPORTING') {
    return 'IMPORTING'
  }

  if (project.status === 'CREATING') {
    return 'CREATING'
  }

  if (project.status === 'STARTING') {
    return 'STARTING'
  }

  if (project.status === 'RUNNING') {
    return 'RUNNING'
  }

  return 'NEEDS_ATTENTION'
}
