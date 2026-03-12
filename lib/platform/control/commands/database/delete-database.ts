import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'

const logger = baseLogger.child({
  module: 'platform/control/commands/database/delete-database',
})

/**
 * Marks a database for deletion so reconciliation can perform the external cleanup.
 */
export async function deleteDatabaseCommand(input: {
  userId: string
  databaseId: string
}): Promise<CommandResult<void>> {
  const database = await prisma.database.findUnique({
    where: { id: input.databaseId },
    include: { project: true },
  })

  if (!database) {
    return { success: false, error: 'Database not found' }
  }

  if (database.project.userId !== input.userId) {
    return { success: false, error: 'Unauthorized' }
  }

  await prisma.database.update({
    where: { id: input.databaseId },
    data: {
      status: 'TERMINATING',
      lockedUntil: null,
    },
  })

  logger.info(`Database ${input.databaseId} marked for deletion`)

  return { success: true, data: undefined }
}
