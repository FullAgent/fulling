import type { UserSkill } from '@prisma/client'

import { prisma } from '@/lib/db'
import { triggerRunnableTasksForProject } from '@/lib/jobs/project-task'
import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'
import { createInstallSkillTask } from '@/lib/platform/persistence/project-task/create-install-skill-task'
import { findSkillCatalogEntry } from '@/lib/skills/catalog'

const logger = baseLogger.child({
  module: 'platform/control/commands/skill/enable-global-skill',
})

/**
 * Enables a skill at the global user scope and fans out install work to the user's current projects.
 *
 * Expected inputs:
 * - A Fulling user ID and a stable skill ID from the local catalog.
 *
 * Expected outputs:
 * - Persists a `UserSkill` record and creates `INSTALL_SKILL` tasks for existing projects.
 *
 * Out of scope:
 * - Does not execute install work directly.
 * - Does not model uninstall behavior.
 */
export async function enableGlobalSkillCommand(input: {
  userId: string
  skillId: string
}): Promise<CommandResult<UserSkill>> {
  const skill = findSkillCatalogEntry(input.skillId)

  if (!skill) {
    return { success: false, error: 'Skill not found' }
  }

  try {
    const runnableProjectIds: string[] = []

    const userSkill = await prisma.$transaction(
      async (tx) => {
        const existingUserSkill = await tx.userSkill.findUnique({
          where: {
            userId_skillId: {
              userId: input.userId,
              skillId: input.skillId,
            },
          },
        })

        if (existingUserSkill) {
          return existingUserSkill
        }

        const createdUserSkill = await tx.userSkill.create({
          data: {
            userId: input.userId,
            skillId: skill.skillId,
            installCommand: skill.installCommand,
          },
        })

        const projects = await tx.project.findMany({
          where: {
            userId: input.userId,
          },
          include: {
            sandboxes: {
              orderBy: { createdAt: 'asc' },
              select: { id: true, status: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        })

        for (const project of projects) {
          const primarySandbox = project.sandboxes[0]
          if (!primarySandbox) {
            continue
          }

          const existingTask = await tx.projectTask.findFirst({
            where: {
              projectId: project.id,
              skillId: skill.skillId,
              type: 'INSTALL_SKILL',
              status: {
                in: ['PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING', 'SUCCEEDED'],
              },
            },
          })

          if (existingTask) {
            continue
          }

          await createInstallSkillTask(tx, {
            projectId: project.id,
            sandboxId: primarySandbox.id,
            userSkillId: createdUserSkill.id,
            skillId: skill.skillId,
            installCommand: skill.installCommand,
          })

          if (primarySandbox.status === 'RUNNING') {
            runnableProjectIds.push(project.id)
          }
        }

        return createdUserSkill
      },
      {
        timeout: 20000,
      }
    )

    await Promise.allSettled(
      runnableProjectIds.map(async (projectId) => {
        await triggerRunnableTasksForProject(projectId)
      })
    )

    logger.info(`Global skill enabled: ${userSkill.skillId} for user ${input.userId}`)
    return { success: true, data: userSkill }
  } catch (error) {
    logger.error(`Failed to enable global skill ${input.skillId} for user ${input.userId}: ${error}`)
    return { success: false, error: 'Failed to enable skill' }
  }
}
