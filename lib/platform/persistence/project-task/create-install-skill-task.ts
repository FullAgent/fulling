import type { Prisma } from '@prisma/client'

import { createProjectTask } from '@/lib/repo/project-task'

export type CreateInstallSkillTaskInput = {
  projectId: string
  sandboxId: string
  userSkillId: string
  skillId: string
  installCommand: string
}

/**
 * Persists the initial install-skill task for a globally enabled user skill.
 *
 * Expected inputs:
 * - A project and sandbox that already exist in persisted control-plane state.
 * - A `UserSkill` record that defines the stable skill identity and install command.
 *
 * Expected outputs:
 * - Creates a ProjectTask record in WAITING_FOR_PREREQUISITES status.
 *
 * Out of scope:
 * - Does not execute the install command.
 * - Does not deduplicate against existing tasks.
 * - Does not decide whether install work should exist for the project.
 */
export async function createInstallSkillTask(
  tx: Prisma.TransactionClient,
  input: CreateInstallSkillTaskInput
) {
  return createProjectTask(tx, {
    projectId: input.projectId,
    sandboxId: input.sandboxId,
    userSkillId: input.userSkillId,
    skillId: input.skillId,
    type: 'INSTALL_SKILL',
    status: 'WAITING_FOR_PREREQUISITES',
    triggerSource: 'POLICY_ROLLOUT',
    payload: {
      userSkillId: input.userSkillId,
      skillId: input.skillId,
      installCommand: input.installCommand,
    },
    maxAttempts: 3,
  })
}
