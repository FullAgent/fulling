import type {
  Prisma,
  ProjectTaskStatus,
  ProjectTaskTriggerSource,
  ProjectTaskType,
} from '@prisma/client'

import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'lib/repo/project-task' })

const LOCK_DURATION_SECONDS = parseInt(process.env.PROJECT_TASK_LOCK_DURATION_SECONDS || '5', 10)

const projectTaskWithRelationsInclude = {
  project: {
    include: {
      user: true,
    },
  },
  sandbox: {
    select: {
      id: true,
      status: true,
    },
  },
} satisfies Prisma.ProjectTaskInclude

type ProjectTaskWithRelations = Prisma.ProjectTaskGetPayload<{
  include: typeof projectTaskWithRelationsInclude
}>

type CreateProjectTaskInput = {
  projectId: string
  sandboxId?: string | null
  userSkillId?: string | null
  skillId?: string | null
  type: ProjectTaskType
  status?: ProjectTaskStatus
  triggerSource: ProjectTaskTriggerSource
  payload?: Prisma.InputJsonValue
  maxAttempts?: number
}

type ProjectTaskStateUpdate = {
  status: ProjectTaskStatus
  error?: string | null
  result?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput
  lockedUntil?: Date | null
  startedAt?: Date | null
  finishedAt?: Date | null
  attemptCount?: number
}

export async function createProjectTask(
  tx: Prisma.TransactionClient,
  input: CreateProjectTaskInput
) {
  return tx.projectTask.create({
    data: {
      projectId: input.projectId,
      sandboxId: input.sandboxId ?? null,
      userSkillId: input.userSkillId ?? null,
      skillId: input.skillId ?? null,
      type: input.type,
      status: input.status ?? 'PENDING',
      triggerSource: input.triggerSource,
      payload: input.payload,
      maxAttempts: input.maxAttempts ?? 3,
    },
  })
}

export async function acquireAndLockProjectTasks(
  limit: number = 10,
  baseLockSeconds: number = LOCK_DURATION_SECONDS,
  randomOffsetSeconds: number = 2
): Promise<ProjectTaskWithRelations[]> {
  try {
    const now = new Date()
    const randomSeconds = Math.random() * randomOffsetSeconds
    const lockUntil = new Date(now.getTime() + (baseLockSeconds + randomSeconds) * 1000)

    const lockedTasks = await prisma.$transaction(async (tx) => {
      return await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE "ProjectTask"
        SET
          "lockedUntil" = ${lockUntil},
          "updatedAt" = NOW()
        WHERE "id" IN (
          SELECT "id"
          FROM "ProjectTask"
          WHERE "status" IN ('PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING')
            AND ("lockedUntil" IS NULL OR "lockedUntil" <= ${now})
          ORDER BY "updatedAt" ASC
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING "id"
      `
    })

    if (lockedTasks.length === 0) {
      return []
    }

    return prisma.projectTask.findMany({
      where: {
        id: {
          in: lockedTasks.map((task) => task.id),
        },
      },
      include: projectTaskWithRelationsInclude,
      orderBy: { createdAt: 'asc' },
    })
  } catch (error) {
    logger.error(`Error acquiring and locking project tasks: ${error}`)
    return []
  }
}

export async function getProjectTaskById(taskId: string): Promise<ProjectTaskWithRelations | null> {
  return prisma.projectTask.findUnique({
    where: { id: taskId },
    include: projectTaskWithRelationsInclude,
  })
}

export async function getLatestProjectTask(input: {
  projectId: string
  type: ProjectTaskType
  skillId?: string
}) {
  return prisma.projectTask.findFirst({
    where: {
      projectId: input.projectId,
      type: input.type,
      ...(input.skillId ? { skillId: input.skillId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getLatestSuccessfulCloneTask(projectId: string) {
  return prisma.projectTask.findFirst({
    where: {
      projectId,
      type: 'CLONE_REPOSITORY',
      status: 'SUCCEEDED',
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findRunningInstallSkillTaskCreatedBefore(input: {
  projectId: string
  skillId: string
  createdBefore: Date
}) {
  return prisma.projectTask.findFirst({
    where: {
      projectId: input.projectId,
      skillId: input.skillId,
      type: 'INSTALL_SKILL',
      status: 'RUNNING',
      createdAt: {
        lt: input.createdBefore,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRunnableTasksForProject(
  projectId: string,
  taskType?: ProjectTaskType
): Promise<ProjectTaskWithRelations[]> {
  return prisma.projectTask.findMany({
    where: {
      projectId,
      type: taskType,
      status: {
        in: ['PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING'],
      },
    },
    include: projectTaskWithRelationsInclude,
    orderBy: { createdAt: 'asc' },
  })
}

export async function tryClaimProjectTaskExecutionLock(
  taskId: string,
  lockSeconds: number
): Promise<boolean> {
  const now = new Date()
  const lockUntil = new Date(now.getTime() + lockSeconds * 1000)

  const result = await prisma.projectTask.updateMany({
    where: {
      id: taskId,
      status: {
        in: ['PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING'],
      },
      OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
    },
    data: {
      status: 'RUNNING',
      error: null,
      lockedUntil: lockUntil,
      startedAt: now,
      updatedAt: now,
    },
  })

  return result.count > 0
}

export async function markProjectTaskRunning(taskId: string, lockSeconds: number): Promise<void> {
  const now = new Date()
  const lockUntil = new Date(now.getTime() + lockSeconds * 1000)

  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: 'RUNNING',
      error: null,
      lockedUntil: lockUntil,
      startedAt: now,
      updatedAt: now,
    },
  })
}

export async function setProjectTaskState(
  taskId: string,
  data: ProjectTaskStateUpdate
): Promise<void> {
  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: data.status,
      error: data.error ?? null,
      result: data.result,
      lockedUntil: data.lockedUntil === undefined ? undefined : data.lockedUntil,
      startedAt: data.startedAt === undefined ? undefined : data.startedAt,
      finishedAt: data.finishedAt === undefined ? undefined : data.finishedAt,
      attemptCount: data.attemptCount,
      updatedAt: new Date(),
    },
  })
}

export async function incrementProjectTaskAttemptCount(taskId: string): Promise<number> {
  const task = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      attemptCount: {
        increment: 1,
      },
      updatedAt: new Date(),
    },
    select: {
      attemptCount: true,
    },
  })

  return task.attemptCount
}

export { LOCK_DURATION_SECONDS, projectTaskWithRelationsInclude }
export type { CreateProjectTaskInput, ProjectTaskWithRelations }
