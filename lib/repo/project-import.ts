import type { Project } from '@prisma/client'

import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'lib/repo/project-import' })

const LOCK_DURATION_SECONDS = parseInt(process.env.PROJECT_IMPORT_LOCK_DURATION_SECONDS || '5', 10)

type ImportProjectWithRelations = Project & {
  user: {
    id: string
  }
  githubAppInstallation: {
    installationId: number
  } | null
  sandboxes: Array<{
    id: string
    status: string
  }>
}

const importProjectWithRelationsInclude = {
  user: {
    select: {
      id: true,
    },
  },
  githubAppInstallation: {
    select: {
      installationId: true,
    },
  },
  sandboxes: {
    select: {
      id: true,
      status: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const

export async function acquireAndLockImportProjects(
  limit: number = 10,
  baseLockSeconds: number = LOCK_DURATION_SECONDS,
  randomOffsetSeconds: number = 2
): Promise<ImportProjectWithRelations[]> {
  try {
    const now = new Date()
    const randomSeconds = Math.random() * randomOffsetSeconds
    const lockUntil = new Date(now.getTime() + (baseLockSeconds + randomSeconds) * 1000)

    const lockedProjects = await prisma.$transaction(async (tx) => {
      return await tx.$queryRaw<Project[]>`
        UPDATE "Project"
        SET
          "importLockedUntil" = ${lockUntil},
          "updatedAt" = NOW()
        WHERE "id" IN (
          SELECT "id"
          FROM "Project"
          WHERE "importStatus" IN ('PENDING', 'CLONING')
            AND ("importLockedUntil" IS NULL OR "importLockedUntil" <= ${now})
          ORDER BY "updatedAt" ASC
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `
    })

    if (lockedProjects.length === 0) {
      return []
    }

    const projectsWithRelations = await prisma.project.findMany({
      where: {
        id: {
          in: lockedProjects.map((project) => project.id),
        },
      },
      include: importProjectWithRelationsInclude,
    })

    return projectsWithRelations
  } catch (error) {
    logger.error(`Error acquiring and locking import projects: ${error}`)
    return []
  }
}

export async function getImportProjectById(projectId: string): Promise<ImportProjectWithRelations | null> {
  return await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: importProjectWithRelationsInclude,
  })
}

export async function tryClaimImportExecutionLock(
  projectId: string,
  lockSeconds: number
): Promise<boolean> {
  const now = new Date()
  const lockUntil = new Date(now.getTime() + lockSeconds * 1000)

  const result = await prisma.project.updateMany({
    where: {
      id: projectId,
      importStatus: {
        in: ['PENDING', 'CLONING'],
      },
      OR: [{ importLockedUntil: null }, { importLockedUntil: { lte: now } }],
    },
    data: {
      importStatus: 'CLONING',
      importError: null,
      importLockedUntil: lockUntil,
      updatedAt: new Date(),
    },
  })

  return result.count > 0
}

export async function setProjectImportState(
  projectId: string,
  data: {
    importStatus: 'PENDING' | 'CLONING' | 'READY' | 'FAILED'
    importError?: string | null
    importLockedUntil?: Date | null
  }
): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      importStatus: data.importStatus,
      importError: data.importError ?? null,
      importLockedUntil:
        data.importLockedUntil === undefined ? undefined : data.importLockedUntil,
      updatedAt: new Date(),
    },
  })
}

export { LOCK_DURATION_SECONDS }
export type { ImportProjectWithRelations }
