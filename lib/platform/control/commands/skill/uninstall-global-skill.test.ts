import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  prisma,
  triggerRunnableTasksForProject,
  createUninstallSkillTask,
  findSkillCatalogEntry,
} = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
  triggerRunnableTasksForProject: vi.fn(),
  createUninstallSkillTask: vi.fn(),
  findSkillCatalogEntry: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma,
}))

vi.mock('@/lib/jobs/project-task', () => ({
  triggerRunnableTasksForProject,
}))

vi.mock('@/lib/platform/persistence/project-task/create-uninstall-skill-task', () => ({
  createUninstallSkillTask,
}))

vi.mock('@/lib/skills/catalog', () => ({
  findSkillCatalogEntry,
}))

import { uninstallGlobalSkillCommand } from '@/lib/platform/control/commands/skill/uninstall-global-skill'

function createUninstallTx() {
  return {
    userSkill: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
    },
    projectTask: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  }
}

type UninstallTx = ReturnType<typeof createUninstallTx>

describe('uninstallGlobalSkillCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findSkillCatalogEntry.mockReturnValue({
      skillId: 'frontend-design',
      uninstallCommand: 'remove frontend-design',
    })
  })

  it('returns an error when the skill is not in the catalog', async () => {
    findSkillCatalogEntry.mockReturnValue(undefined)

    const result = await uninstallGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'missing-skill',
    })

    expect(result).toEqual({
      success: false,
      error: 'Skill not found',
    })
  })

  it('returns success when the user skill is already absent', async () => {
    const tx = createUninstallTx()
    tx.userSkill.findUnique.mockResolvedValue(null)
    prisma.$transaction.mockImplementation(async (callback: (transaction: UninstallTx) => Promise<unknown>) =>
      callback(tx)
    )

    const result = await uninstallGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'frontend-design',
    })

    expect(result).toEqual({
      success: true,
      data: {
        skillId: 'frontend-design',
      },
    })
    expect(createUninstallSkillTask).not.toHaveBeenCalled()
    expect(triggerRunnableTasksForProject).not.toHaveBeenCalled()
  })

  it('cancels stale install tasks and creates uninstall work only where needed', async () => {
    const existingUserSkill = {
      id: 'user-skill-1',
      installCommand: 'install frontend-design',
    }
    const installedAt = new Date('2026-03-17T10:00:00Z')
    const coveredAt = new Date('2026-03-18T10:00:00Z')
    const tx = createUninstallTx()
    tx.userSkill.findUnique.mockResolvedValue(existingUserSkill)
    tx.project.findMany.mockResolvedValue([
      { id: 'project-no-sandbox', sandboxes: [] },
      { id: 'project-running', sandboxes: [{ id: 'sandbox-running', status: 'RUNNING' }] },
      { id: 'project-stopped', sandboxes: [{ id: 'sandbox-stopped', status: 'STOPPED' }] },
      { id: 'project-no-install', sandboxes: [{ id: 'sandbox-no-install', status: 'RUNNING' }] },
      { id: 'project-covered', sandboxes: [{ id: 'sandbox-covered', status: 'RUNNING' }] },
    ])
    tx.projectTask.findFirst.mockImplementation(
      async ({
        where,
      }: {
        where: {
          projectId: string
          type: 'INSTALL_SKILL' | 'UNINSTALL_SKILL'
        }
      }) => {
        if (where.projectId === 'project-running' && where.type === 'INSTALL_SKILL') {
          return { createdAt: installedAt }
        }
        if (where.projectId === 'project-stopped' && where.type === 'INSTALL_SKILL') {
          return { createdAt: installedAt }
        }
        if (where.projectId === 'project-covered' && where.type === 'INSTALL_SKILL') {
          return { createdAt: installedAt }
        }
        if (where.projectId === 'project-covered' && where.type === 'UNINSTALL_SKILL') {
          return { createdAt: coveredAt }
        }

        return null
      }
    )
    tx.projectTask.updateMany.mockResolvedValue({ count: 1 })
    tx.userSkill.delete.mockResolvedValue(existingUserSkill)
    prisma.$transaction.mockImplementation(async (callback: (transaction: UninstallTx) => Promise<unknown>) =>
      callback(tx)
    )

    const result = await uninstallGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'frontend-design',
    })

    expect(result).toEqual({
      success: true,
      data: {
        skillId: 'frontend-design',
      },
    })
    expect(tx.projectTask.updateMany).toHaveBeenCalledTimes(4)
    expect(tx.projectTask.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        projectId: 'project-running',
        skillId: 'frontend-design',
        type: 'INSTALL_SKILL',
        status: {
          in: ['PENDING', 'WAITING_FOR_PREREQUISITES'],
        },
      },
      data: {
        status: 'CANCELLED',
        error: 'Superseded by global uninstall',
        lockedUntil: null,
        startedAt: null,
        finishedAt: expect.any(Date),
      },
    })
    expect(createUninstallSkillTask).toHaveBeenCalledTimes(2)
    expect(createUninstallSkillTask).toHaveBeenNthCalledWith(1, tx, {
      projectId: 'project-running',
      sandboxId: 'sandbox-running',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
      uninstallCommand: 'remove frontend-design',
    })
    expect(createUninstallSkillTask).toHaveBeenNthCalledWith(2, tx, {
      projectId: 'project-stopped',
      sandboxId: 'sandbox-stopped',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
      uninstallCommand: 'remove frontend-design',
    })
    expect(tx.userSkill.delete).toHaveBeenCalledWith({
      where: {
        id: 'user-skill-1',
      },
    })
    expect(triggerRunnableTasksForProject).toHaveBeenCalledTimes(1)
    expect(triggerRunnableTasksForProject).toHaveBeenCalledWith('project-running')
  })

  it('returns a uniform failure when the transaction throws', async () => {
    prisma.$transaction.mockRejectedValue(new Error('db unavailable'))

    const result = await uninstallGlobalSkillCommand({
      userId: 'user-1',
      skillId: 'frontend-design',
    })

    expect(result).toEqual({
      success: false,
      error: 'Failed to uninstall skill',
    })
  })
})
