'use server'

/**
 * Database Server Actions
 *
 * Server Actions for database operations. Frontend components call these
 * to create and delete databases on-demand.
 */

import type { Database } from '@prisma/client'

import { auth } from '@/lib/auth'
import {
  createDatabaseCommand,
  deleteDatabaseCommand,
} from '@/lib/platform/control/commands/database'

import type { ActionResult } from './types'

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

  return createDatabaseCommand({
    userId: session.user.id,
    projectId,
    databaseName,
  })
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

  return deleteDatabaseCommand({
    userId: session.user.id,
    databaseId,
  })
}
