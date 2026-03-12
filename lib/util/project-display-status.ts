import type { ProjectStatus, ProjectTask, ProjectTaskStatus, ProjectTaskType } from '@prisma/client'

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
  const cloneTask = getLatestTask(project.tasks, 'CLONE_REPOSITORY')

  if (cloneTask?.status === 'FAILED') {
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

  if (importProject && cloneTask && isActiveTaskStatus(cloneTask.status)) {
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

function getLatestTask(
  tasks: ProjectDisplayStatusInput['tasks'],
  type: ProjectTaskType
) {
  return tasks
    ?.filter((task) => task.type === type)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
}

function isActiveTaskStatus(status: ProjectTaskStatus): boolean {
  return ['PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING'].includes(status)
}
