import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getUserDefaultNamespace,
  createProjectWithSandbox,
  listUserSkills,
} = vi.hoisted(() => ({
  getUserDefaultNamespace: vi.fn(),
  createProjectWithSandbox: vi.fn(),
  listUserSkills: vi.fn(),
}))

vi.mock('@/lib/platform/integrations/k8s/get-user-default-namespace', () => ({
  getUserDefaultNamespace,
}))

vi.mock('@/lib/platform/persistence/project/create-project-with-sandbox', () => ({
  createProjectWithSandbox,
}))

vi.mock('@/lib/repo/user-skill', () => ({
  listUserSkills,
}))

import { createProjectCommand } from '@/lib/platform/control/commands/project/create-project'

describe('createProjectCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an error when the project name is empty', async () => {
    const result = await createProjectCommand({
      userId: 'user-1',
      name: '   ',
    })

    expect(result).toEqual({
      success: false,
      error: 'Project name cannot be empty',
    })
    expect(getUserDefaultNamespace).not.toHaveBeenCalled()
  })

  it('returns an error immediately when the project name is invalid', async () => {
    const result = await createProjectCommand({
      userId: 'user-1',
      name: '***',
    })

    expect(result).toEqual({
      success: false,
      error: 'Project name can only contain letters, numbers, spaces, and hyphens',
    })
    expect(getUserDefaultNamespace).not.toHaveBeenCalled()
    expect(listUserSkills).not.toHaveBeenCalled()
    expect(createProjectWithSandbox).not.toHaveBeenCalled()
  })

  it('returns an error when the project name does not start with a letter', async () => {
    const result = await createProjectCommand({
      userId: 'user-1',
      name: '1 project',
    })

    expect(result).toEqual({
      success: false,
      error: 'Project name must start with a letter',
    })
  })

  it('returns an error when the project name does not end with a letter', async () => {
    const result = await createProjectCommand({
      userId: 'user-1',
      name: 'Project 1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Project name must end with a letter',
    })
  })

  it('returns a friendly error when kubeconfig is missing', async () => {
    getUserDefaultNamespace.mockRejectedValue(
      new Error('User [user-1] does not have KUBECONFIG configured')
    )

    const result = await createProjectCommand({
      userId: 'user-1',
      name: 'Project Alpha',
    })

    expect(result).toEqual({
      success: false,
      error: 'Please configure your kubeconfig before creating a project',
    })
    expect(listUserSkills).not.toHaveBeenCalled()
    expect(createProjectWithSandbox).not.toHaveBeenCalled()
  })

  it('returns the persistence error when project creation fails', async () => {
    getUserDefaultNamespace.mockResolvedValue('ns-user-1')
    listUserSkills.mockResolvedValue([])
    createProjectWithSandbox.mockResolvedValue({
      success: false,
      error: 'Project already exists',
    })

    const result = await createProjectCommand({
      userId: 'user-1',
      name: 'Project Alpha',
      description: 'Demo project',
    })

    expect(result).toEqual({
      success: false,
      error: 'Project already exists',
    })
    expect(createProjectWithSandbox).toHaveBeenCalledWith({
      userId: 'user-1',
      namespace: 'ns-user-1',
      name: 'Project Alpha',
      description: 'Demo project',
      initialInstallSkills: [],
    })
  })

  it('creates the project with the user namespace and initial skill installs', async () => {
    getUserDefaultNamespace.mockResolvedValue('ns-user-1')
    listUserSkills.mockResolvedValue([
      {
        id: 'user-skill-1',
        skillId: 'frontend-design',
        installCommand: 'install frontend-design',
      },
    ])
    createProjectWithSandbox.mockResolvedValue({
      success: true,
      data: {
        project: {
          id: 'project-1',
          name: 'Project Alpha',
        },
        sandbox: {
          id: 'sandbox-1',
        },
      },
    })

    const result = await createProjectCommand({
      userId: 'user-1',
      name: 'Project Alpha',
      description: 'Demo project',
    })

    expect(result).toEqual({
      success: true,
      data: {
        id: 'project-1',
        name: 'Project Alpha',
      },
    })
    expect(createProjectWithSandbox).toHaveBeenCalledWith({
      userId: 'user-1',
      namespace: 'ns-user-1',
      name: 'Project Alpha',
      description: 'Demo project',
      initialInstallSkills: [
        {
          userSkillId: 'user-skill-1',
          skillId: 'frontend-design',
          installCommand: 'install frontend-design',
        },
      ],
    })
  })
})
