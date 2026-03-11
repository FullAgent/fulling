import type { ProjectImportStatus, ProjectStatus } from '@prisma/client'

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
  importStatus: ProjectImportStatus
  githubRepoFullName?: string | null
  githubAppInstallationId?: string | null
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

  if (project.importStatus === 'FAILED') {
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

  if (importProject && (project.importStatus === 'PENDING' || project.importStatus === 'CLONING')) {
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
