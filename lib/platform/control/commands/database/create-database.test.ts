import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  prisma,
  getK8sServiceForUser,
  toK8sProjectName,
  generateK8sRandomString,
} = vi.hoisted(() => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    database: {
      create: vi.fn(),
    },
  },
  getK8sServiceForUser: vi.fn(),
  toK8sProjectName: vi.fn(),
  generateK8sRandomString: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma,
}))

vi.mock('@/lib/k8s/k8s-service-helper', () => ({
  getK8sServiceForUser,
}))

vi.mock('@/lib/k8s/kubernetes-utils', () => ({
  KubernetesUtils: {
    toK8sProjectName,
    generateRandomString: generateK8sRandomString,
  },
}))

vi.mock('@/lib/k8s/versions', () => ({
  VERSIONS: {
    STORAGE: {
      DATABASE_SIZE: '3Gi',
    },
    RESOURCES: {
      DATABASE: {
        requests: {
          cpu: '100m',
          memory: '102Mi',
        },
        limits: {
          cpu: '1000m',
          memory: '1024Mi',
        },
      },
    },
  },
}))

import { createDatabaseCommand } from '@/lib/platform/control/commands/database/create-database'

describe('createDatabaseCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an error when the project does not exist', async () => {
    prisma.project.findUnique.mockResolvedValue(null)

    const result = await createDatabaseCommand({
      userId: 'user-1',
      projectId: 'project-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Project not found',
    })
    expect(prisma.database.create).not.toHaveBeenCalled()
  })

  it('returns an error when the project belongs to another user', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'other-user',
      databases: [],
    })

    const result = await createDatabaseCommand({
      userId: 'user-1',
      projectId: 'project-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Unauthorized',
    })
  })

  it('returns an error when a database already exists', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
      databases: [{ id: 'database-1' }],
    })

    const result = await createDatabaseCommand({
      userId: 'user-1',
      projectId: 'project-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Database already exists for this project',
    })
  })

  it('returns a friendly error when kubeconfig is missing', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
      name: 'Project Alpha',
      databases: [],
    })
    getK8sServiceForUser.mockRejectedValue(
      new Error('User [user-1] does not have KUBECONFIG configured')
    )

    const result = await createDatabaseCommand({
      userId: 'user-1',
      projectId: 'project-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Please configure your kubeconfig before creating a database',
    })
    expect(prisma.database.create).not.toHaveBeenCalled()
  })

  it('creates the database with the generated default name and expected resource config', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      userId: 'user-1',
      name: 'Project Alpha',
      databases: [],
    })
    prisma.database.create.mockResolvedValue({
      id: 'database-1',
      name: 'projectalpha-db-suffix',
    })
    getK8sServiceForUser.mockResolvedValue({
      getDefaultNamespace: vi.fn().mockReturnValue('ns-user-1'),
    })
    toK8sProjectName.mockReturnValue('projectalpha')
    generateK8sRandomString.mockReturnValue('suffix')

    const result = await createDatabaseCommand({
      userId: 'user-1',
      projectId: 'project-1',
    })

    expect(result).toEqual({
      success: true,
      data: {
        id: 'database-1',
        name: 'projectalpha-db-suffix',
      },
    })
    expect(prisma.database.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        name: 'projectalpha-db-suffix',
        k8sNamespace: 'ns-user-1',
        databaseName: 'projectalpha-db-suffix',
        status: 'CREATING',
        lockedUntil: null,
        storageSize: '3Gi',
        cpuRequest: '100m',
        cpuLimit: '1000m',
        memoryRequest: '102Mi',
        memoryLimit: '1024Mi',
      },
    })
  })
})
