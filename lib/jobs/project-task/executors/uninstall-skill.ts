import type { Prisma } from '@prisma/client'

import type { ProjectTaskWithRelations } from '@/lib/repo/project-task'
import { getLatestSuccessfulCloneTask } from '@/lib/repo/project-task'
import { getSandboxTtydContext } from '@/lib/util/ttyd-context'
import { execCommand } from '@/lib/util/ttyd-exec'

import type { ProjectTaskExecutorResult } from './clone-repository'

const SKILL_UNINSTALL_EXEC_TIMEOUT_MS = parseInt(
  process.env.PROJECT_SKILL_UNINSTALL_EXEC_TIMEOUT_MS || '120000',
  10
)

type UninstallSkillPayload = {
  skillId?: string
  installCommand?: string
  uninstallCommand?: string
}

type CloneTaskResult = {
  importPath?: string
}

/**
 * Executes a skill uninstall command inside the project's sandbox.
 *
 * Expected inputs:
 * - A `UNINSTALL_SKILL` task with a valid `uninstallCommand` payload.
 * - A sandbox already verified as runnable by task prerequisite evaluation.
 *
 * Expected outputs:
 * - Runs the command inside the sandbox and returns task result metadata.
 *
 * Out of scope:
 * - Does not decide whether the skill should still exist for the project.
 * - Does not auto-start stopped sandboxes to perform removal.
 */
export async function runUninstallSkillTask(
  task: ProjectTaskWithRelations
): Promise<ProjectTaskExecutorResult> {
  const payload = (task.payload ?? {}) as UninstallSkillPayload
  const skillId = payload.skillId
  const installCommand = payload.installCommand?.trim()
  const uninstallCommand = payload.uninstallCommand?.trim()

  if (!skillId || !installCommand || !uninstallCommand) {
    return {
      success: false,
      error: 'Missing uninstall skill payload',
      retryable: false,
    }
  }

  if (!task.sandbox?.id) {
    return {
      success: false,
      error: 'Sandbox not found for uninstall task',
      retryable: false,
    }
  }

  try {
    const workingDirectory = await resolveSkillWorkingDirectory(task)
    const { ttyd } = await getSandboxTtydContext(task.sandbox.id, task.project.user.id)

    const command = [
      'set -e',
      `cd '${shellEscapeSingleQuoted(workingDirectory)}'`,
      uninstallCommand,
    ].join(' && ')

    await execCommand(
      ttyd.baseUrl,
      ttyd.accessToken,
      command,
      SKILL_UNINSTALL_EXEC_TIMEOUT_MS,
      ttyd.authorization
    )

    return {
      success: true,
      result: {
        skillId,
        installCommand,
        uninstallCommand,
        workingDirectory,
      } satisfies Prisma.InputJsonValue,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      retryable: true,
    }
  }
}

async function resolveSkillWorkingDirectory(task: ProjectTaskWithRelations): Promise<string> {
  const defaultDirectory = '/home/fulling/next'

  if (!task.project.githubRepoFullName) {
    return defaultDirectory
  }

  const cloneTask = await getLatestSuccessfulCloneTask(task.projectId)
  if (!cloneTask) {
    throw new Error('Imported repository is not available for skill uninstallation')
  }

  const cloneResult = (cloneTask.result ?? {}) as CloneTaskResult
  if (!cloneResult.importPath) {
    throw new Error('Clone task result is missing importPath')
  }

  return `${defaultDirectory}/${cloneResult.importPath}`
}

function shellEscapeSingleQuoted(input: string): string {
  return input.replace(/'/g, `'\\''`)
}
