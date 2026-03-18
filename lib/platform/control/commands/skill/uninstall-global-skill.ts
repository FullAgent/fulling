import { prisma } from '@/lib/db'
import { triggerRunnableTasksForProject } from '@/lib/jobs/project-task'
import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'
import { createUninstallSkillTask } from '@/lib/platform/persistence/project-task/create-uninstall-skill-task'
import { findSkillCatalogEntry } from '@/lib/skills/catalog'

const logger = baseLogger.child({
  module: 'platform/control/commands/skill/uninstall-global-skill',
})

const STALE_INSTALL_CANCEL_REASON = 'Superseded by global uninstall'

/**
 * Removes a globally enabled skill and fans out uninstall work to projects that still need removal.
 *
 * Expected inputs:
 * - A Fulling user ID and a stable skill ID from the local catalog.
 *
 * Expected outputs:
 * - Deletes the `UserSkill` source of truth and creates `UNINSTALL_SKILL` tasks where needed.
 *
 * Out of scope:
 * - Does not execute uninstall work directly.
 * - Does not auto-start stopped sandboxes.
 */
export async function uninstallGlobalSkillCommand(input: {
  userId: string
  skillId: string
}): Promise<CommandResult<{ skillId: string }>> {
  const skill = findSkillCatalogEntry(input.skillId)

  if (!skill) {
    return { success: false, error: 'Skill not found' }
  }

  try {
    const runnableProjectIds: string[] = []

    const removed = await prisma.$transaction(
      async (tx) => {
        const existingUserSkill = await tx.userSkill.findUnique({
          where: {
            userId_skillId: {
              userId: input.userId,
              skillId: input.skillId,
            },
          },
        })

        if (!existingUserSkill) {
          return false
        }

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

          const latestInstalledOrRunningTask = await tx.projectTask.findFirst({
            where: {
              projectId: project.id,
              skillId: skill.skillId,
              type: 'INSTALL_SKILL',
              status: {
                in: ['RUNNING', 'SUCCEEDED'],
              },
            },
            orderBy: { createdAt: 'desc' },
          })

          const latestCoveringUninstallTask = await tx.projectTask.findFirst({
            where: {
              projectId: project.id,
              skillId: skill.skillId,
              type: 'UNINSTALL_SKILL',
              status: {
                in: ['PENDING', 'WAITING_FOR_PREREQUISITES', 'RUNNING', 'SUCCEEDED'],
              },
            },
            orderBy: { createdAt: 'desc' },
          })

          await tx.projectTask.updateMany({
            where: {
              projectId: project.id,
              skillId: skill.skillId,
              type: 'INSTALL_SKILL',
              status: {
                in: ['PENDING', 'WAITING_FOR_PREREQUISITES'],
              },
            },
            data: {
              status: 'CANCELLED',
              error: STALE_INSTALL_CANCEL_REASON,
              lockedUntil: null,
              startedAt: null,
              finishedAt: new Date(),
            },
          })

          if (
            !latestInstalledOrRunningTask ||
            (latestCoveringUninstallTask &&
              latestCoveringUninstallTask.createdAt > latestInstalledOrRunningTask.createdAt)
          ) {
            continue
          }

          await createUninstallSkillTask(tx, {
            projectId: project.id,
            sandboxId: primarySandbox.id,
            userSkillId: existingUserSkill.id,
            skillId: skill.skillId,
            installCommand: existingUserSkill.installCommand,
            uninstallCommand: skill.uninstallCommand,
          })

          if (primarySandbox.status === 'RUNNING') {
            runnableProjectIds.push(project.id)
          }
        }

        await tx.userSkill.delete({
          where: {
            id: existingUserSkill.id,
          },
        })

        return true
      },
      {
        timeout: 20000,
      }
    )

    if (!removed) {
      logger.info(`Global skill already absent: ${input.skillId} for user ${input.userId}`)
      return {
        success: true,
        data: {
          skillId: input.skillId,
        },
      }
    }

    await Promise.allSettled(
      runnableProjectIds.map(async (projectId) => {
        await triggerRunnableTasksForProject(projectId)
      })
    )

    logger.info(`Global skill uninstalled: ${input.skillId} for user ${input.userId}`)
    return {
      success: true,
      data: {
        skillId: input.skillId,
      },
    }
  } catch (error) {
    logger.error(`Failed to uninstall global skill ${input.skillId} for user ${input.userId}: ${error}`)
    return { success: false, error: 'Failed to uninstall skill' }
  }
}
