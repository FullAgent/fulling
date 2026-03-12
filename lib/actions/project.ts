'use server'

/**
 * Project Server Actions
 *
 * Server Actions for project operations. Frontend components call these
 * instead of API Routes directly.
 */

import type { Project } from '@prisma/client'

import { auth } from '@/lib/auth'
import {
  createProjectCommand,
  createProjectFromGitHubCommand,
  type CreateProjectFromGitHubCommandInput,
} from '@/lib/platform/control/commands/project'

import type { ActionResult } from './types'

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

  return createProjectCommand({
    userId: session.user.id,
    name,
    description,
  })
}

export type ImportProjectPayload = CreateProjectFromGitHubCommandInput

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

  return createProjectFromGitHubCommand({
    userId: session.user.id,
    ...payload,
  })
}
