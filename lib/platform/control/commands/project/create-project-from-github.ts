import type { Project } from '@prisma/client'

import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'
import { findInstallationRepository } from '@/lib/platform/integrations/github/find-installation-repository'
import { getUserDefaultNamespace } from '@/lib/platform/integrations/k8s/get-user-default-namespace'
import { findGitHubInstallationById } from '@/lib/platform/persistence/github/find-github-installation-by-id'
import { createProjectWithSandbox } from '@/lib/platform/persistence/project/create-project-with-sandbox'
import { createCloneRepositoryTask } from '@/lib/platform/persistence/project-task/create-clone-repository-task'

import { validateProjectName } from './shared'

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
 * Initializes GitHub import state after ownership and repository access are verified.
 *
 * Expected inputs:
 * - A Fulling user ID plus GitHub installation and repository metadata selected by the user.
 *
 * Expected outputs:
 * - Creates the imported project state and its initial clone task, then returns the project.
 *
 * Out of scope:
 * - Does not execute the repository clone.
 * - Does not advance task prerequisites or sandbox lifecycle.
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

  const installation = await findGitHubInstallationById(input.installationId)
  if (!installation || installation.userId !== input.userId) {
    return { success: false, error: 'Installation not found' }
  }

  try {
    const repo = await findInstallationRepository({
      installationId: installation.installationId,
      repoId: input.repoId,
      repoFullName: input.repoFullName,
    })

    if (!repo) {
      return { success: false, error: 'Repository not found in selected installation' }
    }
  } catch (error) {
    logger.error(`Failed to verify repository for import: ${error}`)
    return { success: false, error: 'Failed to verify repository access' }
  }

  let namespace: string
  try {
    namespace = await getUserDefaultNamespace(input.userId)
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not have KUBECONFIG configured')) {
      return {
        success: false,
        error: 'Please configure your kubeconfig before creating a project',
      }
    }
    throw error
  }

  const result = await createProjectWithSandbox({
    userId: input.userId,
    namespace,
    name: input.repoName,
    description: input.description,
    githubSource: {
      githubAppInstallationId: installation.id,
      githubRepoId: input.repoId,
      githubRepoFullName: input.repoFullName,
      githubRepoDefaultBranch: input.defaultBranch,
    },
  })

  if (!result.success) {
    return result
  }

  await createCloneRepositoryTask({
    projectId: result.data.project.id,
    sandboxId: result.data.sandbox.id,
    installationId: installation.installationId,
    repoId: input.repoId,
    repoFullName: input.repoFullName,
    defaultBranch: input.defaultBranch,
  })

  return {
    success: true,
    data: result.data.project,
  }
}
