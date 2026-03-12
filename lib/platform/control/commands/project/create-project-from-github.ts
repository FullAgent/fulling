import type { Project } from '@prisma/client'

import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'
import { getInstallationByGitHubId } from '@/lib/repo/github'
import { listInstallationRepos } from '@/lib/services/github-app'

import { createProjectWithSandbox, validateProjectName } from './shared'

const logger = baseLogger.child({
  module: 'platform/control/commands/project/create-project-from-github',
})

export interface CreateProjectFromGitHubCommandInput {
  installationId: number
  repoId: number
  repoName: string
  repoFullName: string
  defaultBranch: string
  description?: string
}

/**
 * Creates the control-plane state for a GitHub import flow after repository ownership is verified.
 */
export async function createProjectFromGitHubCommand(
  input: {
    userId: string
  } & CreateProjectFromGitHubCommandInput
): Promise<CommandResult<Project>> {
  if (!input.repoName || !input.repoFullName || !input.defaultBranch) {
    return { success: false, error: 'Repository metadata is required' }
  }

  const nameValidation = validateProjectName(input.repoName)
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || 'Invalid project name format' }
  }

  const installation = await getInstallationByGitHubId(input.installationId)
  if (!installation || installation.userId !== input.userId) {
    return { success: false, error: 'Installation not found' }
  }

  try {
    const repos = await listInstallationRepos(installation.installationId)
    const matchedRepo = repos.find(
      (repo) => repo.id === input.repoId && repo.full_name === input.repoFullName
    )

    if (!matchedRepo) {
      return { success: false, error: 'Repository not found in selected installation' }
    }
  } catch (error) {
    logger.error(`Failed to verify repository for import: ${error}`)
    return { success: false, error: 'Failed to verify repository access' }
  }

  return createProjectWithSandbox({
    userId: input.userId,
    name: input.repoName,
    description: input.description,
    importData: {
      githubAppInstallationId: installation.id,
      installationId: installation.installationId,
      githubRepoId: input.repoId,
      githubRepoFullName: input.repoFullName,
      githubRepoDefaultBranch: input.defaultBranch,
    },
  })
}
