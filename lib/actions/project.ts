'use server'

/**
 * Project Server Actions
 *
 * Server Actions for project operations. Frontend components call these
 * instead of API Routes directly.
 */

import type { Project } from '@prisma/client'

import { auth } from '@/lib/auth'
import { EnvironmentCategory } from '@/lib/const'
import { prisma } from '@/lib/db'
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'
import { KubernetesUtils } from '@/lib/k8s/kubernetes-utils'
import { VERSIONS } from '@/lib/k8s/versions'
import { logger as baseLogger } from '@/lib/logger'
import { getInstallationByGitHubId } from '@/lib/repo/github'
import { createProjectTask } from '@/lib/repo/project-task'
import { listInstallationRepos } from '@/lib/services/github-app'
import { generateRandomString } from '@/lib/util/common'

import type { ActionResult } from './types'

const logger = baseLogger.child({ module: 'actions/project' })

/**
 * Validate project name format
 * Rules:
 * - Only letters, numbers, spaces, and hyphens allowed
 * - Must start with a letter
 * - Must end with a letter
 */
function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' }
  }

  const allowedPattern = /^[a-zA-Z0-9\s-]+$/
  if (!allowedPattern.test(name)) {
    return {
      valid: false,
      error: 'Project name can only contain letters, numbers, spaces, and hyphens',
    }
  }

  const trimmedName = name.trim()
  if (!/^[a-zA-Z]/.test(trimmedName)) {
    return { valid: false, error: 'Project name must start with a letter' }
  }

  if (!/[a-zA-Z]$/.test(trimmedName)) {
    return { valid: false, error: 'Project name must end with a letter' }
  }

  return { valid: true }
}

type CreateProjectWithSandboxOptions = {
  userId: string
  name: string
  description?: string
  importData?: {
    githubAppInstallationId: string
    installationId: number
    githubRepoId: number
    githubRepoFullName: string
    githubRepoDefaultBranch?: string
  }
}

/**
 * Shared project creation flow used by both "New Project" and "Import from GitHub".
 * Creates Project + Sandbox + required environment variables in one transaction.
 */
async function createProjectWithSandbox({
  userId,
  name,
  description,
  importData,
}: CreateProjectWithSandboxOptions): Promise<ActionResult<Project>> {
  logger.info(`Creating project: ${name} for user: ${userId}`)

  let k8sService
  let namespace
  try {
    k8sService = await getK8sServiceForUser(userId)
    namespace = k8sService.getDefaultNamespace()
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not have KUBECONFIG configured')) {
      logger.warn(`Project creation failed - missing kubeconfig for user: ${userId}`)
      return {
        success: false,
        error: 'Please configure your kubeconfig before creating a project',
      }
    }
    throw error
  }

  const k8sProjectName = KubernetesUtils.toK8sProjectName(name)
  const randomSuffix = KubernetesUtils.generateRandomString()
  const ttydAuthToken = generateRandomString(24)
  const fileBrowserUsername = `fb-${randomSuffix}`
  const fileBrowserPassword = generateRandomString(16)
  const sandboxName = `${k8sProjectName}-${randomSuffix}`

  const result = await prisma.$transaction(
    async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description,
          userId,
          status: 'CREATING',
          githubAppInstallationId: importData?.githubAppInstallationId,
          githubRepoId: importData?.githubRepoId,
          githubRepoFullName: importData?.githubRepoFullName,
          githubRepoDefaultBranch: importData?.githubRepoDefaultBranch,
        },
      })

      const sandbox = await tx.sandbox.create({
        data: {
          projectId: project.id,
          name: sandboxName,
          k8sNamespace: namespace,
          sandboxName: sandboxName,
          status: 'CREATING',
          lockedUntil: null,
          runtimeImage: VERSIONS.RUNTIME_IMAGE,
          cpuRequest: VERSIONS.RESOURCES.SANDBOX.requests.cpu,
          cpuLimit: VERSIONS.RESOURCES.SANDBOX.limits.cpu,
          memoryRequest: VERSIONS.RESOURCES.SANDBOX.requests.memory,
          memoryLimit: VERSIONS.RESOURCES.SANDBOX.limits.memory,
        },
      })

      await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'TTYD_ACCESS_TOKEN',
          value: ttydAuthToken,
          category: EnvironmentCategory.TTYD,
          isSecret: true,
        },
      })

      await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'FILE_BROWSER_USERNAME',
          value: fileBrowserUsername,
          category: EnvironmentCategory.FILE_BROWSER,
          isSecret: false,
        },
      })

      await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'FILE_BROWSER_PASSWORD',
          value: fileBrowserPassword,
          category: EnvironmentCategory.FILE_BROWSER,
          isSecret: true,
        },
      })

      if (importData?.githubRepoDefaultBranch) {
        await createProjectTask(tx, {
          projectId: project.id,
          sandboxId: sandbox.id,
          type: 'CLONE_REPOSITORY',
          status: 'WAITING_FOR_PREREQUISITES',
          triggerSource: 'USER_ACTION',
          payload: {
            installationId: importData.installationId,
            repoId: importData.githubRepoId,
            repoFullName: importData.githubRepoFullName,
            defaultBranch: importData.githubRepoDefaultBranch,
          },
          maxAttempts: 3,
        })
      }

      return { project, sandbox }
    },
    {
      timeout: 20000,
    }
  )

  logger.info(`Project created: ${result.project.id} with sandbox: ${result.sandbox.id}`)
  return { success: true, data: result.project }
}

/**
 * Create a new project with database and sandbox.
 *
 * @param name - Project name
 * @param description - Optional project description
 */
export async function createProject(
  name: string,
  description?: string
): Promise<ActionResult<Project>> {
  const session = await auth()

  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate project name format
  const nameValidation = validateProjectName(name)
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || 'Invalid project name format' }
  }

  return createProjectWithSandbox({
    userId: session.user.id,
    name,
    description,
  })
}

export interface ImportProjectPayload {
  installationId: number
  repoId: number
  repoName: string
  repoFullName: string
  defaultBranch: string
  description?: string
}

/**
 * Create project in import mode. This only creates project + sandbox metadata and returns immediately.
 * The background import reconcile job performs the actual clone when sandbox becomes RUNNING.
 */
export async function importProjectFromGitHub(
  payload: ImportProjectPayload
): Promise<ActionResult<Project>> {
  const session = await auth()

  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!payload.repoName || !payload.repoFullName || !payload.defaultBranch) {
    return { success: false, error: 'Repository metadata is required' }
  }

  const nameValidation = validateProjectName(payload.repoName)
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || 'Invalid project name format' }
  }

  const installation = await getInstallationByGitHubId(payload.installationId)
  if (!installation || installation.userId !== session.user.id) {
    return { success: false, error: 'Installation not found' }
  }

  try {
    const repos = await listInstallationRepos(installation.installationId)
    const matchedRepo = repos.find(
      (repo) => repo.id === payload.repoId && repo.full_name === payload.repoFullName
    )

    if (!matchedRepo) {
      return { success: false, error: 'Repository not found in selected installation' }
    }
  } catch (error) {
    logger.error(`Failed to verify repository for import: ${error}`)
    return { success: false, error: 'Failed to verify repository access' }
  }

  return createProjectWithSandbox({
    userId: session.user.id,
    name: payload.repoName,
    description: payload.description,
    importData: {
      githubAppInstallationId: installation.id,
      installationId: installation.installationId,
      githubRepoId: payload.repoId,
      githubRepoFullName: payload.repoFullName,
      githubRepoDefaultBranch: payload.defaultBranch,
    },
  })
}
