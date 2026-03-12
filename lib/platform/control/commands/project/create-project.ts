import type { Project } from '@prisma/client'

import { CommandResult } from '@/lib/platform/control/types'

import { createProjectWithSandbox, validateProjectName } from './shared'

/**
 * Creates a blank project and persists the initial sandbox state for later reconciliation.
 */
export async function createProjectCommand(input: {
  userId: string
  name: string
  description?: string
}): Promise<CommandResult<Project>> {
  const nameValidation = validateProjectName(input.name)
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error || 'Invalid project name format' }
  }

  return createProjectWithSandbox({
    userId: input.userId,
    name: input.name,
    description: input.description,
  })
}
