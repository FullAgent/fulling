import type { ProjectTask, ProjectTaskStatus, ProjectTaskType } from '@prisma/client'

export type ProjectImportStatus = 'IMPORTING' | 'IMPORTED' | 'IMPORT_FAILED' | 'NOT_STARTED'

type ProjectImportStatusInput = {
  tasks?: Pick<ProjectTask, 'type' | 'status' | 'createdAt'>[]
}

/**
 * Derives the current import transaction state from the latest clone task.
 *
 * Expected inputs:
 * - Project tasks that may include one or more CLONE_REPOSITORY records.
 *
 * Expected outputs:
 * - Returns the current import state for the latest clone task.
 *
 * Out of scope:
 * - Does not inspect sandbox or project resource status.
 * - Does not infer whether a project originated from GitHub metadata.
 */
export function getProjectImportStatus(
  input: ProjectImportStatusInput
): ProjectImportStatus {
  const cloneTask = getLatestTask(input.tasks, 'CLONE_REPOSITORY')

  if (!cloneTask) {
    return 'NOT_STARTED'
  }

  if (isActiveTaskStatus(cloneTask.status)) {
    return 'IMPORTING'
  }

  if (cloneTask.status === 'SUCCEEDED') {
    return 'IMPORTED'
  }

  if (cloneTask.status === 'FAILED' || cloneTask.status === 'CANCELLED') {
    return 'IMPORT_FAILED'
  }

  return 'NOT_STARTED'
}

export function getLatestProjectTask(
  tasks: ProjectImportStatusInput['tasks'],
  type: ProjectTaskType
) {
  return getLatestTask(tasks, type)
}

function getLatestTask(
  tasks: ProjectImportStatusInput['tasks'],
  type: ProjectTaskType
) {
  return tasks
    ?.filter((task) => task.type === type)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
}

function isActiveTaskStatus(status: ProjectTaskStatus): boolean {
  return ['PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING'].includes(status)
}
