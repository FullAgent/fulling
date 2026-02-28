import type { GitHubInstallationStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'lib/repo/github' })

export async function upsertInstallation(data: {
  installationId: number
  userId: string
  accountId: number
  accountLogin: string
  accountType: string
  accountAvatarUrl?: string | null
  repositorySelection: string
  permissions?: Record<string, string>
  events?: string[]
}) {
  return prisma.gitHubAppInstallation.upsert({
    where: { installationId: data.installationId },
    create: {
      installationId: data.installationId,
      userId: data.userId,
      accountId: data.accountId,
      accountLogin: data.accountLogin,
      accountType: data.accountType,
      accountAvatarUrl: data.accountAvatarUrl,
      repositorySelection: data.repositorySelection,
      permissions: data.permissions ?? {},
      events: data.events ?? [],
    },
    update: {
      accountLogin: data.accountLogin,
      accountAvatarUrl: data.accountAvatarUrl,
      repositorySelection: data.repositorySelection,
      permissions: data.permissions ?? {},
      events: data.events ?? [],
      status: 'ACTIVE',
      suspendedAt: null,
    },
  })
}

export async function updateInstallationStatus(
  installationId: number,
  status: GitHubInstallationStatus,
  suspendedAt?: Date | null
) {
  try {
    return await prisma.gitHubAppInstallation.update({
      where: { installationId },
      data: {
        status,
        suspendedAt: suspendedAt ?? (status === 'SUSPENDED' ? new Date() : null),
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      logger.warn(`Installation ${installationId} not found, skipping status update to ${status}`)
      return null
    }
    throw error
  }
}

export async function getInstallationByGitHubId(installationId: number) {
  return prisma.gitHubAppInstallation.findUnique({
    where: { installationId },
    include: { user: true },
  })
}

export async function getInstallationsForUser(userId: string) {
  return prisma.gitHubAppInstallation.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })
}

export async function linkProjectToRepo(
  projectId: string,
  installationId: string,
  githubRepoId: number,
  githubRepoFullName: string
) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      githubAppInstallationId: installationId,
      githubRepoId,
      githubRepoFullName,
    },
  })
}

export async function unlinkProjectFromRepo(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      githubAppInstallationId: null,
      githubRepoId: null,
      githubRepoFullName: null,
    },
  })
}
