import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listInstallationRepos } = vi.hoisted(() => ({
  listInstallationRepos: vi.fn(),
}))

vi.mock('@/lib/services/github-app', () => ({
  listInstallationRepos,
}))

import { findInstallationRepository } from '@/lib/platform/integrations/github/find-installation-repository'

describe('findInstallationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the matching repository when id and full name both match', async () => {
    listInstallationRepos.mockResolvedValue([
      { id: 201, full_name: 'acme/other' },
      { id: 202, full_name: 'acme/project-alpha' },
    ])

    const result = await findInstallationRepository({
      installationId: 101,
      repoId: 202,
      repoFullName: 'acme/project-alpha',
    })

    expect(result).toEqual({
      id: 202,
      full_name: 'acme/project-alpha',
    })
  })

  it('returns null when the repo id does not match', async () => {
    listInstallationRepos.mockResolvedValue([{ id: 203, full_name: 'acme/project-alpha' }])

    const result = await findInstallationRepository({
      installationId: 101,
      repoId: 202,
      repoFullName: 'acme/project-alpha',
    })

    expect(result).toBeNull()
  })

  it('returns null when the repo full name does not match', async () => {
    listInstallationRepos.mockResolvedValue([{ id: 202, full_name: 'acme/other' }])

    const result = await findInstallationRepository({
      installationId: 101,
      repoId: 202,
      repoFullName: 'acme/project-alpha',
    })

    expect(result).toBeNull()
  })

  it('returns null when the installation has no repositories', async () => {
    listInstallationRepos.mockResolvedValue([])

    const result = await findInstallationRepository({
      installationId: 101,
      repoId: 202,
      repoFullName: 'acme/project-alpha',
    })

    expect(result).toBeNull()
  })
})
