import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  prisma,
  toK8sProjectName,
  generateK8sRandomString,
  createInstallSkillTask,
  generateRandomString,
} = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
  },
  toK8sProjectName: vi.fn(),
  generateK8sRandomString: vi.fn(),
  createInstallSkillTask: vi.fn(),
  generateRandomString: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma,
}))

vi.mock('@/lib/k8s/kubernetes-utils', () => ({
  KubernetesUtils: {
    toK8sProjectName,
    generateRandomString: generateK8sRandomString,
  },
}))

vi.mock('@/lib/k8s/versions', () => ({
  VERSIONS: {
    RUNTIME_IMAGE: 'runtime:test',
    RESOURCES: {
      SANDBOX: {
        requests: {
          cpu: '20m',
          memory: '25Mi',
        },
        limits: {
          cpu: '2000m',
          memory: '4096Mi',
        },
      },
    },
  },
}))

vi.mock('@/lib/platform/persistence/project-task/create-install-skill-task', () => ({
  createInstallSkillTask,
}))

vi.mock('@/lib/util/common', () => ({
  generateRandomString,
}))

import { createProjectWithSandbox } from '@/lib/platform/persistence/project/create-project-with-sandbox'

function createProjectTx() {
  return {
    project: {
      create: vi.fn(),
    },
    sandbox: {
      create: vi.fn(),
    },
    environment: {
      create: vi.fn(),
    },
  }
}

type CreateProjectTx = ReturnType<typeof createProjectTx>

describe('createProjectWithSandbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    toK8sProjectName.mockReturnValue('projectalpha')
    generateK8sRandomString.mockReturnValue('suffix')
    generateRandomString
      .mockReturnValueOnce('ttyd-token')
      .mockReturnValueOnce('file-browser-password')
  })

  it('creates project, sandbox, and three environments without initial skill tasks', async () => {
    const tx = createProjectTx()
    tx.project.create.mockResolvedValue({ id: 'project-1', name: 'Project Alpha' })
    tx.sandbox.create.mockResolvedValue({ id: 'sandbox-1' })
    tx.environment.create.mockResolvedValue({})
    prisma.$transaction.mockImplementation(
      async (
        callback: (transaction: CreateProjectTx) => Promise<unknown>,
        options?: { timeout: number }
      ) => {
        expect(options).toEqual({ timeout: 20000 })
        return callback(tx)
      }
    )

    const result = await createProjectWithSandbox({
      userId: 'user-1',
      namespace: 'ns-user-1',
      name: 'Project Alpha',
      description: 'Demo project',
    })

    expect(result).toEqual({
      success: true,
      data: {
        project: { id: 'project-1', name: 'Project Alpha' },
        sandbox: { id: 'sandbox-1' },
      },
    })
    expect(tx.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Project Alpha',
        description: 'Demo project',
        userId: 'user-1',
        status: 'CREATING',
        githubAppInstallationId: undefined,
        githubRepoId: undefined,
        githubRepoFullName: undefined,
        githubRepoDefaultBranch: undefined,
      },
    })
    expect(tx.sandbox.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        name: 'projectalpha-suffix',
        k8sNamespace: 'ns-user-1',
        sandboxName: 'projectalpha-suffix',
        status: 'CREATING',
        lockedUntil: null,
        runtimeImage: 'runtime:test',
        cpuRequest: '20m',
        cpuLimit: '2000m',
        memoryRequest: '25Mi',
        memoryLimit: '4096Mi',
      },
    })
    expect(tx.environment.create).toHaveBeenCalledTimes(3)
    expect(tx.environment.create).toHaveBeenNthCalledWith(1, {
      data: {
        projectId: 'project-1',
        key: 'TTYD_ACCESS_TOKEN',
        value: 'ttyd-token',
        category: 'ttyd',
        isSecret: true,
      },
    })
    expect(tx.environment.create).toHaveBeenNthCalledWith(2, {
      data: {
        projectId: 'project-1',
        key: 'FILE_BROWSER_USERNAME',
        value: 'fb-suffix',
        category: 'file_browser',
        isSecret: false,
      },
    })
    expect(tx.environment.create).toHaveBeenNthCalledWith(3, {
      data: {
        projectId: 'project-1',
        key: 'FILE_BROWSER_PASSWORD',
        value: 'file-browser-password',
        category: 'file_browser',
        isSecret: true,
      },
    })
    expect(createInstallSkillTask).not.toHaveBeenCalled()
  })

  it('persists github source fields and creates install tasks for initial skills', async () => {
    const tx = createProjectTx()
    tx.project.create.mockResolvedValue({ id: 'project-1', name: 'Project Alpha' })
    tx.sandbox.create.mockResolvedValue({ id: 'sandbox-1' })
    tx.environment.create.mockResolvedValue({})
    prisma.$transaction.mockImplementation(async (callback: (transaction: CreateProjectTx) => Promise<unknown>) =>
      callback(tx)
    )

    await createProjectWithSandbox({
      userId: 'user-1',
      namespace: 'ns-user-1',
      name: 'Project Alpha',
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
        {
          userSkillId: 'user-skill-2',
          skillId: 'backend-tooling',
          installCommand: 'install backend-tooling',
        },
      ],
    })

    expect(tx.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Project Alpha',
        description: undefined,
        userId: 'user-1',
        status: 'CREATING',
        githubAppInstallationId: 'gha-1',
        githubRepoId: 202,
        githubRepoFullName: 'acme/project-alpha',
        githubRepoDefaultBranch: 'main',
      },
    })
    expect(createInstallSkillTask).toHaveBeenCalledTimes(2)
    expect(createInstallSkillTask).toHaveBeenNthCalledWith(1, tx, {
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      userSkillId: 'user-skill-1',
      skillId: 'frontend-design',
      installCommand: 'install frontend-design',
    })
    expect(createInstallSkillTask).toHaveBeenNthCalledWith(2, tx, {
      projectId: 'project-1',
      sandboxId: 'sandbox-1',
      userSkillId: 'user-skill-2',
      skillId: 'backend-tooling',
      installCommand: 'install backend-tooling',
    })
  })
})
