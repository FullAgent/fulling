import type { Project } from '@prisma/client'

import { CommandResult } from '@/lib/platform/control/types'
import { getUserDefaultNamespace } from '@/lib/platform/integrations/k8s/get-user-default-namespace'
import { createProjectWithSandbox } from '@/lib/platform/persistence/project/create-project-with-sandbox'

import { validateProjectName } from './shared'

/**
 * Initializes a blank project after validating the requested project name.
 *
 * Expected inputs:
 * - A Fulling user ID and a valid project name.
 *
 * Expected outputs:
 * - Creates the initial project and sandbox state, then returns the project record.
 *
 * Out of scope:
 * - Does not create project tasks.
 * - Does not perform external Kubernetes effects.
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
    name: input.name,
    description: input.description,
  })

  if (!result.success) {
    return result
  }

  return {
    success: true,
    data: result.data.project,
  }
}
