import type { Prisma } from '@prisma/client'

import type { ProjectTaskWithRelations } from '@/lib/repo/project-task'
import { getLatestSuccessfulCloneTask } from '@/lib/repo/project-task'
import { getSandboxTtydContext } from '@/lib/util/ttyd-context'
import { execCommand } from '@/lib/util/ttyd-exec'

import type { ProjectTaskExecutorResult } from './clone-repository'

const SKILL_INSTALL_EXEC_TIMEOUT_MS = parseInt(
  process.env.PROJECT_SKILL_INSTALL_EXEC_TIMEOUT_MS || '120000',
  10
)

type InstallSkillPayload = {
  skillId?: string
  installCommand?: string
}

type CloneTaskResult = {
  importPath?: string
}

/**
 * Executes a skill install command inside the project's sandbox.
 *
 * Expected inputs:
 * - An `INSTALL_SKILL` task with a valid `installCommand` payload.
 * - A sandbox already verified as runnable by task prerequisite evaluation.
 *
 * Expected outputs:
 * - Runs the command inside the sandbox and returns task result metadata.
 *
 * Out of scope:
 * - Does not decide whether the skill should exist for the project.
 * - Does not reconcile clone prerequisites.
 */
export async function runInstallSkillTask(
  task: ProjectTaskWithRelations
): Promise<ProjectTaskExecutorResult> {
  const payload = (task.payload ?? {}) as InstallSkillPayload
  const skillId = payload.skillId
  const installCommand = payload.installCommand?.trim()

  if (!skillId || !installCommand) {
    return {
      success: false,
      error: 'Missing install skill payload',
      retryable: false,
    }
  }

  if (!task.sandbox?.id) {
    return {
      success: false,
      error: 'Sandbox not found for install task',
      retryable: false,
    }
  }

  try {
    const workingDirectory = await resolveSkillWorkingDirectory(task)
    const { ttyd } = await getSandboxTtydContext(task.sandbox.id, task.project.user.id)

    const command = [
      'set -e',
      `cd '${shellEscapeSingleQuoted(workingDirectory)}'`,
      installCommand,
    ].join(' && ')

    await execCommand(
      ttyd.baseUrl,
      ttyd.accessToken,
      command,
      SKILL_INSTALL_EXEC_TIMEOUT_MS,
      ttyd.authorization
    )

    return {
      success: true,
      result: {
        skillId,
        installCommand,
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
    throw new Error('Imported repository is not available for skill installation')
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
