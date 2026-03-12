import type { Project } from '@prisma/client'

import { EnvironmentCategory } from '@/lib/const'
import { prisma } from '@/lib/db'
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'
import { KubernetesUtils } from '@/lib/k8s/kubernetes-utils'
import { VERSIONS } from '@/lib/k8s/versions'
import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'
import { createProjectTask } from '@/lib/repo/project-task'
import { generateRandomString } from '@/lib/util/common'

const logger = baseLogger.child({ module: 'platform/control/commands/project/shared' })

export type CreateProjectWithSandboxOptions = {
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
 * Validates the project display name before the control layer persists any state.
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
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

/**
 * Creates the initial control-plane records for a project and its primary sandbox.
 */
export async function createProjectWithSandbox({
  userId,
  name,
  description,
  importData,
}: CreateProjectWithSandboxOptions): Promise<CommandResult<Project>> {
  logger.info(`Creating project: ${name} for user: ${userId}`)

  let namespace: string
  try {
    const k8sService = await getK8sServiceForUser(userId)
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
          sandboxName,
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

      return project
    },
    {
      timeout: 20000,
    }
  )

  logger.info(`Project created: ${result.id}`)
  return { success: true, data: result }
}
