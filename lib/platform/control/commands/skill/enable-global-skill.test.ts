import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  prisma,
  triggerRunnableTasksForProject,
  createInstallSkillTask,
  findSkillCatalogEntry,
} = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
  triggerRunnableTasksForProject: vi.fn(),
  createInstallSkillTask: vi.fn(),
  findSkillCatalogEntry: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma,
}))

vi.mock('@/lib/jobs/project-task', () => ({
  triggerRunnableTasksForProject,
}))

vi.mock('@/lib/platform/persistence/project-task/create-install-skill-task', () => ({
  createInstallSkillTask,
}))

vi.mock('@/lib/skills/catalog', () => ({
  findSkillCatalogEntry,
}))

import { enableGlobalSkillCommand } from '@/lib/platform/control/commands/skill/enable-global-skill'

function createEnableTx() {
  return {
    userSkill: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
    },
    projectTask: {
      findFirst: vi.fn(),
    },
  }
}

type EnableTx = ReturnType<typeof createEnableTx>

describe('enableGlobalSkillCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findSkillCatalogEntry.mockReturnValue({
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
    })
  })

  it('returns an error when the skill is not in the catalog', async () => {
    findSkillCatalogEntry.mockReturnValue(undefined)

    const result = await enableGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'missing-skill',
    })

    expect(result).toEqual({
      success: false,
      error: 'Skill not found',
    })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('returns the existing user skill without creating tasks when already enabled', async () => {
    const existingUserSkill = {
      id: 'user-skill-1',
      skillId: 'frontend-design',
    }
    const tx = createEnableTx()
    tx.userSkill.findUnique.mockResolvedValue(existingUserSkill)
    prisma.$transaction.mockImplementation(async (callback: (transaction: EnableTx) => Promise<unknown>) =>
      callback(tx)
    )

    const result = await enableGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'frontend-design',
    })

    expect(result).toEqual({
      success: true,
      data: existingUserSkill,
    })
    expect(tx.userSkill.create).not.toHaveBeenCalled()
    expect(tx.project.findMany).not.toHaveBeenCalled()
    expect(createInstallSkillTask).not.toHaveBeenCalled()
    expect(triggerRunnableTasksForProject).not.toHaveBeenCalled()
  })

  it('creates install tasks only for projects that need them and triggers runnable ones', async () => {
    const createdUserSkill = {
      id: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
    }
    const tx = createEnableTx()
    tx.userSkill.findUnique.mockResolvedValue(null)
    tx.userSkill.create.mockResolvedValue(createdUserSkill)
    tx.project.findMany.mockResolvedValue([
      { id: 'project-no-sandbox', sandboxes: [] },
      { id: 'project-running', sandboxes: [{ id: 'sandbox-running', status: 'RUNNING' }] },
      { id: 'project-stopped', sandboxes: [{ id: 'sandbox-stopped', status: 'STOPPED' }] },
      { id: 'project-existing-task', sandboxes: [{ id: 'sandbox-existing', status: 'RUNNING' }] },
    ])
    tx.projectTask.findFirst.mockImplementation(async ({ where }: { where: { projectId: string } }) => {
      if (where.projectId === 'project-existing-task') {
        return { id: 'task-1' }
      }

      return null
    })
    prisma.$transaction.mockImplementation(async (callback: (transaction: EnableTx) => Promise<unknown>) =>
      callback(tx)
    )

    const result = await enableGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'frontend-design',
    })

    expect(result).toEqual({
      success: true,
      data: createdUserSkill,
    })
    expect(createInstallSkillTask).toHaveBeenCalledTimes(2)
    expect(createInstallSkillTask).toHaveBeenNthCalledWith(1, tx, {
      projectId: 'project-running',
      sandboxId: 'sandbox-running',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
    })
    expect(createInstallSkillTask).toHaveBeenNthCalledWith(2, tx, {
      projectId: 'project-stopped',
      sandboxId: 'sandbox-stopped',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
    })
    expect(triggerRunnableTasksForProject).toHaveBeenCalledTimes(1)
    expect(triggerRunnableTasksForProject).toHaveBeenCalledWith('project-running')
  })

  it('returns a uniform failure when the transaction throws', async () => {
    prisma.$transaction.mockRejectedValue(new Error('db unavailable'))

    const result = await enableGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'frontend-design',
    })

    expect(result).toEqual({
      success: false,
      error: 'Failed to enable skill',
    })
  })
})
