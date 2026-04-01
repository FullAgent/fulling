import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    database: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db', () => ({
  prisma,
}))

import { deleteDatabaseCommand } from '@/lib/platform/control/commands/database/delete-database'

describe('deleteDatabaseCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an error when the database does not exist', async () => {
    prisma.database.findUnique.mockResolvedValue(null)

    const result = await deleteDatabaseCommand({
      userId: 'user-1',
      databaseId: 'database-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Database not found',
    })
    expect(prisma.database.update).not.toHaveBeenCalled()
  })

  it('returns an error when the database belongs to another user', async () => {
    prisma.database.findUnique.mockResolvedValue({
      id: 'database-1',
      project: {
        userId: 'other-user',
      },
    })

    const result = await deleteDatabaseCommand({
      userId: 'user-1',
      databaseId: 'database-1',
    })

    expect(result).toEqual({
      success: false,
      error: 'Unauthorized',
    })
    expect(prisma.database.update).not.toHaveBeenCalled()
  })

  it('marks the database as terminating and clears the lock', async () => {
    prisma.database.findUnique.mockResolvedValue({
      id: 'database-1',
      project: {
        userId: 'user-1',
      },
    })
    prisma.database.update.mockResolvedValue({
      id: 'database-1',
    })

    const result = await deleteDatabaseCommand({
      userId: 'user-1',
      databaseId: 'database-1',
    })

    expect(result).toEqual({
      success: true,
      data: undefined,
    })
    expect(prisma.database.update).toHaveBeenCalledWith({
      where: { id: 'database-1' },
      data: {
        status: 'TERMINATING',
        lockedUntil: null,
      },
    })
  })
})
