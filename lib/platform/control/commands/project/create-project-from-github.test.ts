import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  findInstallationRepository,
  getUserDefaultNamespace,
  findGitHubInstallationById,
  createProjectWithSandbox,
  createCloneRepositoryTask,
  listUserSkills,
} = vi.hoisted(() => ({
  findInstallationRepository: vi.fn(),
  getUserDefaultNamespace: vi.fn(),
  findGitHubInstallationById: vi.fn(),
  createProjectWithSandbox: vi.fn(),
  createCloneRepositoryTask: vi.fn(),
  listUserSkills: vi.fn(),
}))

vi.mock('@/lib/platform/integrations/github/find-installation-repository', () => ({
  findInstallationRepository,
}))

vi.mock('@/lib/platform/integrations/k8s/get-user-default-namespace', () => ({
  getUserDefaultNamespace,
}))

vi.mock('@/lib/platform/persistence/github/find-github-installation-by-id', () => ({
  findGitHubInstallationById,
}))

vi.mock('@/lib/platform/persistence/project/create-project-with-sandbox', () => ({
  createProjectWithSandbox,
}))

vi.mock('@/lib/platform/persistence/project-task/create-clone-repository-task', () => ({
  createCloneRepositoryTask,
}))

vi.mock('@/lib/repo/user-skill', () => ({
  listUserSkills,
}))

import { createProjectFromGitHubCommand } from '@/lib/platform/control/commands/project/create-project-from-github'

const baseInput = {
  userId: 'user-1',
  installationId: 101,
  repoId: 202,
  repoName: 'Project Alpha',
  repoFullName: 'acme/project-alpha',
  defaultBranch: 'main',
  description: 'Imported project',
}

describe('createProjectFromGitHubCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an error when repository metadata is incomplete', async () => {
    const result = await createProjectFromGitHubCommand({
      ...baseInput,
      repoFullName: '',
    })

    expect(result).toEqual({
      success: false,
      error: 'Repository metadata is required',
    })
    expect(findGitHubInstallationById).not.toHaveBeenCalled()
  })

  it('returns an error when the repo name is invalid', async () => {
    const result = await createProjectFromGitHubCommand({
      ...baseInput,
      repoName: '***',
    })

    expect(result).toEqual({
      success: false,
      error: 'Project name can only contain letters, numbers, spaces, and hyphens',
    })
    expect(findGitHubInstallationById).not.toHaveBeenCalled()
  })

  it('returns an error when the installation is missing or belongs to another user', async () => {
    findGitHubInstallationById.mockResolvedValue({
      id: 'gha-1',
      installationId: 101,
      userId: 'other-user',
    })

    const result = await createProjectFromGitHubCommand(baseInput)

    expect(result).toEqual({
      success: false,
      error: 'Installation not found',
    })
    expect(findInstallationRepository).not.toHaveBeenCalled()
  })

  it('returns an error when repository verification fails', async () => {
    findGitHubInstallationById.mockResolvedValue({
      id: 'gha-1',
      installationId: 101,
      userId: 'user-1',
    })
    findInstallationRepository.mockRejectedValue(new Error('GitHub unavailable'))

    const result = await createProjectFromGitHubCommand(baseInput)

    expect(result).toEqual({
      success: false,
      error: 'Failed to verify repository access',
    })
  })

  it('returns an error when the repository is not accessible in the installation', async () => {
    findGitHubInstallationById.mockResolvedValue({
      id: 'gha-1',
      installationId: 101,
      userId: 'user-1',
    })
    findInstallationRepository.mockResolvedValue(null)

    const result = await createProjectFromGitHubCommand(baseInput)

    expect(result).toEqual({
      success: false,
      error: 'Repository not found in selected installation',
    })
  })

  it('returns a friendly error when kubeconfig is missing', async () => {
    findGitHubInstallationById.mockResolvedValue({
      id: 'gha-1',
      installationId: 101,
      userId: 'user-1',
    })
    findInstallationRepository.mockResolvedValue({
      id: 202,
      full_name: 'acme/project-alpha',
    })
    getUserDefaultNamespace.mockRejectedValue(
      new Error('User [user-1] does not have KUBECONFIG configured')
    )

    const result = await createProjectFromGitHubCommand(baseInput)

    expect(result).toEqual({
      success: false,
      error: 'Please configure your kubeconfig before creating a project',
    })
    expect(createProjectWithSandbox).not.toHaveBeenCalled()
    expect(createCloneRepositoryTask).not.toHaveBeenCalled()
  })

  it('does not create a clone task when project creation fails', async () => {
    findGitHubInstallationById.mockResolvedValue({
      id: 'gha-1',
      installationId: 101,
      userId: 'user-1',
    })
    findInstallationRepository.mockResolvedValue({
      id: 202,
      full_name: 'acme/project-alpha',
    })
    getUserDefaultNamespace.mockResolvedValue('ns-user-1')
    listUserSkills.mockResolvedValue([])
    createProjectWithSandbox.mockResolvedValue({
      success: false,
      error: 'Project already exists',
    })

    const result = await createProjectFromGitHubCommand(baseInput)

    expect(result).toEqual({
      success: false,
      error: 'Project already exists',
    })
    expect(createCloneRepositoryTask).not.toHaveBeenCalled()
  })

  it('creates the project and clone task when verification succeeds', async () => {
    findGitHubInstallationById.mockResolvedValue({
      id: 'gha-1',
      installationId: 101,
      userId: 'user-1',
    })
    findInstallationRepository.mockResolvedValue({
      id: 202,
      full_name: 'acme/project-alpha',
    })
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
        project: { id: 'project-1', name: 'Project Alpha' },
        sandbox: { id: 'sandbox-1' },
      },
    })

    const result = await createProjectFromGitHubCommand(baseInput)

    expect(result).toEqual({
      success: true,
      data: { id: 'project-1', name: 'Project Alpha' },
    })
    expect(findInstallationRepository).toHaveBeenCalledWith({
      installationId: 101,
      repoId: 202,
      repoFullName: 'acme/project-alpha',
    })
    expect(createProjectWithSandbox).toHaveBeenCalledWith({
      userId: 'user-1',
      namespace: 'ns-user-1',
      name: 'Project Alpha',
      description: 'Imported project',
      githubSource: {
        githubAppInstallationId: 'gha-1',
        githubRepoId: 202,
        githubRepoFullName: 'acme/project-alpha',
        githubRepoDefaultBranch: 'main',
      },
      initialInstallSkills: [
        {
          userSkillId: 'user-skill-1',
          skillId: 'frontend-design',
          installCommand: 'install frontend-design',
        },
      ],
    })
    expect(createCloneRepositoryTask).toHaveBeenCalledWith({
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      installationId: 101,
      repoId: 202,
      repoFullName: 'acme/project-alpha',
      defaultBranch: 'main',
    })
  })
})
