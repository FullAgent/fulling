import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createProjectTask } = vi.hoisted(() => ({
  createProjectTask: vi.fn(),
}))

vi.mock('@/lib/repo/project-task', () => ({
  createProjectTask,
}))

import { createInstallSkillTask } from '@/lib/platform/persistence/project-task/create-install-skill-task'

describe('createInstallSkillTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an install skill task with the expected routing fields', async () => {
    const tx = { projectTask: {} } as never

    await createInstallSkillTask(tx, {
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
    })

    expect(createProjectTask).toHaveBeenCalledWith(tx, {
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      type: 'INSTALL_SKILL',
      status: 'WAITING_FOR_PREREQUISITES',
      triggerSource: 'POLICY_ROLLOUT',
      payload: {
        userSkillId: 'user-skill-1',
        skillId: 'frontend-design',
        installCommand: 'install frontend-design',
      },
      maxAttempts: 3,
    })
  })
})
