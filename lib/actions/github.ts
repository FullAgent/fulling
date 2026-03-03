'use server'

import type { GitHubAppInstallation } from '@prisma/client'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'
import { getInstallationByGitHubId, getInstallationsForUser } from '@/lib/repo/github'
import { listInstallationRepos } from '@/lib/services/github-app'

import type { ActionResult } from './types'

const logger = baseLogger.child({ module: 'actions/github' })

export type GitHubInstallation = Pick<
  GitHubAppInstallation,
  | 'id'
  | 'installationId'
  | 'accountLogin'
  | 'accountType'
  | 'accountAvatarUrl'
  | 'repositorySelection'
  | 'status'
>

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  language: string | null
  html_url: string
}

export async function checkGitHubIdentity(): Promise<
  ActionResult<{ linked: boolean; githubId?: string; githubLogin?: string }>
> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const githubIdentity = await prisma.userIdentity.findFirst({
    where: {
      userId: session.user.id,
      provider: 'GITHUB',
    },
  })

  if (!githubIdentity) {
    return { success: true, data: { linked: false } }
  }

  return {
    success: true,
    data: {
      linked: true,
      githubId: githubIdentity.providerUserId,
      githubLogin: (githubIdentity.metadata as Record<string, string>)?.login,
    },
  }
}

export async function getInstallations(): Promise<ActionResult<GitHubInstallation[]>> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const installations = await getInstallationsForUser(session.user.id)

    const data: GitHubInstallation[] = installations.map((inst) => ({
      id: inst.id,
      installationId: inst.installationId,
      accountLogin: inst.accountLogin,
      accountType: inst.accountType,
      accountAvatarUrl: inst.accountAvatarUrl,
      repositorySelection: inst.repositorySelection,
      status: inst.status,
    }))

    return { success: true, data }
  } catch (error) {
    logger.error(`Failed to get installations: ${error}`)
    return { success: false, error: 'Failed to get installations' }
  }
}

export async function getInstallationRepos(
  installationId: string
): Promise<ActionResult<GitHubRepo[]>> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const installation = await getInstallationByGitHubId(parseInt(installationId, 10))

    if (!installation || installation.userId !== session.user.id) {
      return { success: false, error: 'Installation not found' }
    }

    const repos = await listInstallationRepos(installation.installationId)

    const data: GitHubRepo[] = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      html_url: repo.html_url,
    }))

    return { success: true, data }
  } catch (error) {
    logger.error(`Failed to get installation repos: ${error}`)
    return { success: false, error: 'Failed to get repositories' }
  }
}
