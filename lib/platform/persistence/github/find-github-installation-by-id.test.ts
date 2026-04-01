import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    gitHubAppInstallation: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma,
}))

import { findGitHubInstallationById } from '@/lib/platform/persistence/github/find-github-installation-by-id'

describe('findGitHubInstallationById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries by installation id and always includes the owning user', async () => {
    prisma.gitHubAppInstallation.findUnique.mockResolvedValue({
      id: 'gha-1',
    })

    await findGitHubInstallationById(101)

    expect(prisma.gitHubAppInstallation.findUnique).toHaveBeenCalledWith({
      where: { installationId: 101 },
      include: { user: true },
    })
  })
})
