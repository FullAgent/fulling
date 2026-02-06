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

  logger.info(`Creating project: ${name} for user: ${session.user.id}`)

  // Get K8s service for user
  let k8sService
  let namespace
  try {
    k8sService = await getK8sServiceForUser(session.user.id)
    namespace = k8sService.getDefaultNamespace()
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not have KUBECONFIG configured')) {
      logger.warn(`Project creation failed - missing kubeconfig for user: ${session.user.id}`)
      return {
        success: false,
        error: 'Please configure your kubeconfig before creating a project',
      }
    }
    throw error
  }

  // Generate K8s compatible names
  const k8sProjectName = KubernetesUtils.toK8sProjectName(name)
  const randomSuffix = KubernetesUtils.generateRandomString()
  const ttydAuthToken = generateRandomString(24) // 24 chars = ~143 bits entropy for terminal auth
  const fileBrowserUsername = `fb-${randomSuffix}` // filebrowser username
  const fileBrowserPassword = generateRandomString(16) // 16 char random password
  const databaseName = `${k8sProjectName}-${randomSuffix}`
  const sandboxName = `${k8sProjectName}-${randomSuffix}`

  // Create project with database and sandbox in a transaction
  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Create Project with status CREATING
      const project = await tx.project.create({
        data: {
          name,
          description,
          userId: session.user.id,
          status: 'CREATING',
        },
      })

      // 2. Create Database record - lockedUntil is null so reconcile job can process immediately
      const database = await tx.database.create({
        data: {
          projectId: project.id,
          name: databaseName,
          k8sNamespace: namespace,
          databaseName: databaseName,
          status: 'CREATING',
          lockedUntil: null, // Unlocked - ready for reconcile job to process
          // Resource configuration from versions
          storageSize: VERSIONS.STORAGE.DATABASE_SIZE,
          cpuRequest: VERSIONS.RESOURCES.DATABASE.requests.cpu,
          cpuLimit: VERSIONS.RESOURCES.DATABASE.limits.cpu,
          memoryRequest: VERSIONS.RESOURCES.DATABASE.requests.memory,
          memoryLimit: VERSIONS.RESOURCES.DATABASE.limits.memory,
        },
      })

      // 3. Create Sandbox record - lockedUntil is null so reconcile job can process immediately
      const sandbox = await tx.sandbox.create({
        data: {
          projectId: project.id,
          name: sandboxName,
          k8sNamespace: namespace,
          sandboxName: sandboxName,
          status: 'CREATING',
          lockedUntil: null, // Unlocked - ready for reconcile job to process
          // Resource configuration from versions
          runtimeImage: VERSIONS.RUNTIME_IMAGE,
          cpuRequest: VERSIONS.RESOURCES.SANDBOX.requests.cpu,
          cpuLimit: VERSIONS.RESOURCES.SANDBOX.limits.cpu,
          memoryRequest: VERSIONS.RESOURCES.SANDBOX.requests.memory,
          memoryLimit: VERSIONS.RESOURCES.SANDBOX.limits.memory,
        },
      })

      // 4. Create Environment record for ttyd access token
      const ttydEnv = await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'TTYD_ACCESS_TOKEN',
          value: ttydAuthToken,
          category: EnvironmentCategory.TTYD,
          isSecret: true, // Mark as secret since it's an access token
        },
      })

      // 5. Create Environment records for filebrowser credentials
      const fileBrowserUsernameEnv = await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'FILE_BROWSER_USERNAME',
          value: fileBrowserUsername,
          category: EnvironmentCategory.FILE_BROWSER,
          isSecret: false,
        },
      })

      const fileBrowserPasswordEnv = await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'FILE_BROWSER_PASSWORD',
          value: fileBrowserPassword,
          category: EnvironmentCategory.FILE_BROWSER,
          isSecret: true, // Mark as secret since it's a password
        },
      })

      return {
        project,
        database,
        sandbox,
        ttydEnv,
        fileBrowserUsernameEnv,
        fileBrowserPasswordEnv,
      }
    },
    {
      timeout: 20000,
    }
  )

  logger.info(
    `Project created: ${result.project.id} with database: ${result.database.id}, sandbox: ${result.sandbox.id}`
  )

  return { success: true, data: result.project }
}
