import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createProjectTask } = vi.hoisted(() => ({
  createProjectTask: vi.fn(),
}))

vi.mock('@/lib/repo/project-task', () => ({
  createProjectTask,
}))

import { createUninstallSkillTask } from '@/lib/platform/persistence/project-task/create-uninstall-skill-task'

describe('createUninstallSkillTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an uninstall skill task with install and uninstall commands in payload', async () => {
    const tx = { projectTask: {} } as never

    await createUninstallSkillTask(tx, {
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
      uninstallCommand: 'remove frontend-design',
    })

    expect(createProjectTask).toHaveBeenCalledWith(tx, {
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      skillId: 'frontend-design',
      type: 'UNINSTALL_SKILL',
      status: 'WAITING_FOR_PREREQUISITES',
      triggerSource: 'POLICY_ROLLOUT',
      payload: {
        userSkillId: 'user-skill-1',
        skillId: 'frontend-design',
        installCommand: 'install frontend-design',
        uninstallCommand: 'remove frontend-design',
      },
      maxAttempts: 3,
    })
  })
})
