import type { Database } from '@prisma/client'

import { prisma } from '@/lib/db'
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'
import { KubernetesUtils } from '@/lib/k8s/kubernetes-utils'
import { VERSIONS } from '@/lib/k8s/versions'
import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'

const logger = baseLogger.child({
  module: 'platform/control/commands/database/create-database',
})

/**
 * Creates the database control-plane record for an existing project.
 */
export async function createDatabaseCommand(input: {
  userId: string
  projectId: string
  databaseName?: string
}): Promise<CommandResult<Database>> {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    include: { databases: true },
  })

  if (!project) {
    return { success: false, error: 'Project not found' }
  }

  if (project.userId !== input.userId) {
    return { success: false, error: 'Unauthorized' }
  }

  if (project.databases.length > 0) {
    return { success: false, error: 'Database already exists for this project' }
  }

  let namespace: string
  try {
    const k8sService = await getK8sServiceForUser(input.userId)
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

  const k8sProjectName = KubernetesUtils.toK8sProjectName(project.name)
  const randomSuffix = KubernetesUtils.generateRandomString()
  const finalDatabaseName = input.databaseName || `${k8sProjectName}-db-${randomSuffix}`

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
