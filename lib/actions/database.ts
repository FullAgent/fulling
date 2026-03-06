'use server'

/**
 * Database Server Actions
 *
 * Server Actions for database operations. Frontend components call these
 * to create and delete databases on-demand.
 */

import type { Database } from '@prisma/client'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'
import { KubernetesUtils } from '@/lib/k8s/kubernetes-utils'
import { VERSIONS } from '@/lib/k8s/versions'
import { logger as baseLogger } from '@/lib/logger'

import type { ActionResult } from './types'

const logger = baseLogger.child({ module: 'actions/database' })

/**
 * Create a database for an existing project
 *
 * @param projectId - Project ID
 * @param databaseName - Optional custom database name (auto-generated if not provided)
 */
export async function createDatabase(
  projectId: string,
  databaseName?: string
): Promise<ActionResult<Database>> {
  const session = await auth()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify project exists and belongs to user
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { databases: true },
  })

  if (!project) {
    return { success: false, error: 'Project not found' }
  }

  if (project.userId !== session.user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check if database already exists
  if (project.databases.length > 0) {
    return { success: false, error: 'Database already exists for this project' }
  }

  // Get K8s service for user
  let k8sService
  let namespace
  try {
    k8sService = await getK8sServiceForUser(session.user.id)
    namespace = k8sService.getDefaultNamespace()
  } catch (error) {
    if (error instanceof Error && error.message.includes('does not have KUBECONFIG configured')) {
      return {
        success: false,
        error: 'Please configure your kubeconfig before creating a database',
      }
    }
    throw error
  }

  // Generate database name if not provided
  const k8sProjectName = KubernetesUtils.toK8sProjectName(project.name)
  const randomSuffix = KubernetesUtils.generateRandomString()
  const finalDatabaseName = databaseName || `${k8sProjectName}-db-${randomSuffix}`

  // Create Database record
  const database = await prisma.database.create({
    data: {
      projectId: project.id,
      name: finalDatabaseName,
      k8sNamespace: namespace,
      databaseName: finalDatabaseName,
      status: 'CREATING',
      lockedUntil: null,
      storageSize: VERSIONS.STORAGE.DATABASE_SIZE,
      cpuRequest: VERSIONS.RESOURCES.DATABASE.requests.cpu,
      cpuLimit: VERSIONS.RESOURCES.DATABASE.limits.cpu,
      memoryRequest: VERSIONS.RESOURCES.DATABASE.requests.memory,
      memoryLimit: VERSIONS.RESOURCES.DATABASE.limits.memory,
    },
  })

  logger.info(`Database created: ${database.id} for project: ${project.id}`)

  return { success: true, data: database }
}

/**
 * Delete a database
 *
 * @param databaseId - Database ID
 */
export async function deleteDatabase(databaseId: string): Promise<ActionResult<void>> {
  const session = await auth()
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify database exists and belongs to user
  const database = await prisma.database.findUnique({
    where: { id: databaseId },
    include: { project: true },
  })

  if (!database) {
    return { success: false, error: 'Database not found' }
  }

  if (database.project.userId !== session.user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // Update status to TERMINATING (reconciliation job will handle K8s deletion)
  await prisma.database.update({
    where: { id: databaseId },
    data: {
      status: 'TERMINATING',
      lockedUntil: null, // Unlock for reconciliation job
    },
  })

  logger.info(`Database ${databaseId} marked for deletion`)

  return { success: true, data: undefined }
}
