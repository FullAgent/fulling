import type { Prisma, ProjectTaskStatus, ProjectTaskType } from '@prisma/client'
import { ProjectTaskTriggerSource } from '@prisma/client'

import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'
import { createProjectTask } from '@/lib/repo/project-task'

const logger = baseLogger.child({ module: 'lib/services/project-task-dispatcher' })

type DispatchProjectTaskInput = {
  projectId: string
  sandboxId?: string | null
  type: ProjectTaskType
  triggerSource: ProjectTaskTriggerSource
  payload?: Prisma.InputJsonValue
  status?: ProjectTaskStatus
  maxAttempts?: number
}

export async function dispatchProjectTask(input: DispatchProjectTaskInput) {
  const task = await prisma.$transaction(async (tx) =>
    createProjectTask(tx, {
      projectId: input.projectId,
      sandboxId: input.sandboxId,
      type: input.type,
      status: input.status,
      triggerSource: input.triggerSource,
      payload: input.payload,
      maxAttempts: input.maxAttempts,
    })
  )

  logger.info(`Dispatched project task ${task.id} (${task.type}) for project ${task.projectId}`)
  return task
}

export async function dispatchCloneRepositoryTask(input: {
  projectId: string
  sandboxId: string
  installationId: number
  repoId: number
  repoFullName: string
  defaultBranch: string
}) {
  return dispatchProjectTask({
    projectId: input.projectId,
    sandboxId: input.sandboxId,
    type: 'CLONE_REPOSITORY',
    status: 'WAITING_FOR_PREREQUISITES',
    triggerSource: ProjectTaskTriggerSource.USER_ACTION,
    payload: {
      installationId: input.installationId,
      repoId: input.repoId,
      repoFullName: input.repoFullName,
      defaultBranch: input.defaultBranch,
    },
    maxAttempts: 3,
  })
}
