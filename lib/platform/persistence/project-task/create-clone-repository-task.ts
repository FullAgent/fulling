import { prisma } from '@/lib/db'

/**
 * Persists the initial clone-repository task for a GitHub import project.
 *
 * Expected inputs:
 * - A project and sandbox that already exist in persisted control-plane state.
 * - Repository metadata required later by the clone executor.
 *
 * Expected outputs:
 * - Creates a ProjectTask record in WAITING_FOR_PREREQUISITES status.
 *
 * Out of scope:
 * - Does not verify GitHub access or ownership.
 * - Does not decide whether the task should exist.
 * - Does not execute the clone itself.
 */
export async function createCloneRepositoryTask(input: {
  projectId: string
  sandboxId: string
  installationId: number
  repoId: number
  repoFullName: string
  defaultBranch: string
}) {
  return prisma.projectTask.create({
    data: {
      projectId: input.projectId,
      sandboxId: input.sandboxId,
      type: 'CLONE_REPOSITORY',
      status: 'WAITING_FOR_PREREQUISITES',
      triggerSource: 'USER_ACTION',
      payload: {
        installationId: input.installationId,
        repoId: input.repoId,
        repoFullName: input.repoFullName,
        defaultBranch: input.defaultBranch,
      },
      maxAttempts: 3,
    },
  })
}
