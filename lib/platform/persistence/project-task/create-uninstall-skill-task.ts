import type { Prisma } from '@prisma/client'

import { createProjectTask } from '@/lib/repo/project-task'

export type CreateUninstallSkillTaskInput = {
  projectId: string
  sandboxId: string
  userSkillId: string
  skillId: string
  installCommand: string
  uninstallCommand: string
}

/**
 * Persists uninstall work that converges a project away from a globally removed skill.
 *
 * Expected inputs:
 * - A project and sandbox that already exist in persisted control-plane state.
 * - A historical `UserSkill` identity plus install and uninstall command snapshots.
 *
 * Expected outputs:
 * - Creates a ProjectTask record in WAITING_FOR_PREREQUISITES status.
 *
 * Out of scope:
 * - Does not execute the uninstall command.
 * - Does not deduplicate against existing tasks.
 * - Does not decide whether uninstall work is required for the project.
 */
export async function createUninstallSkillTask(
  tx: Prisma.TransactionClient,
  input: CreateUninstallSkillTaskInput
) {
  return createProjectTask(tx, {
    projectId: input.projectId,
    sandboxId: input.sandboxId,
    skillId: input.skillId,
    type: 'UNINSTALL_SKILL',
    status: 'WAITING_FOR_PREREQUISITES',
    triggerSource: 'POLICY_ROLLOUT',
    payload: {
      userSkillId: input.userSkillId,
      skillId: input.skillId,
      installCommand: input.installCommand,
      uninstallCommand: input.uninstallCommand,
    },
    maxAttempts: 3,
  })
}
