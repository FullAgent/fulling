import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    projectTask: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma,
}))

import { createCloneRepositoryTask } from '@/lib/platform/persistence/project-task/create-clone-repository-task'

describe('createCloneRepositoryTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a waiting clone task with the expected payload', async () => {
    prisma.projectTask.create.mockResolvedValue({ id: 'task-1' })

    await createCloneRepositoryTask({
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      installationId: 101,
      repoId: 202,
      repoFullName: 'acme/project-alpha',
      defaultBranch: 'main',
    })

    expect(prisma.projectTask.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        sandboxId: 'sandbox-1',
        type: 'CLONE_REPOSITORY',
        status: 'WAITING_FOR_PREREQUISITES',
        triggerSource: 'USER_ACTION',
        payload: {
          installationId: 101,
          repoId: 202,
          repoFullName: 'acme/project-alpha',
          defaultBranch: 'main',
        },
        maxAttempts: 3,
      },
    })
  })
})
