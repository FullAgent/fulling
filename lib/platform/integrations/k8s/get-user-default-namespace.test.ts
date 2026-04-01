import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getK8sServiceForUser } = vi.hoisted(() => ({
  getK8sServiceForUser: vi.fn(),
}))

vi.mock('@/lib/k8s/k8s-service-helper', () => ({
  getK8sServiceForUser,
}))

import { getUserDefaultNamespace } from '@/lib/platform/integrations/k8s/get-user-default-namespace'

describe('getUserDefaultNamespace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the default namespace from the user k8s service', async () => {
    getK8sServiceForUser.mockResolvedValue({
      getDefaultNamespace: vi.fn().mockReturnValue('ns-user-1'),
    })

    const result = await getUserDefaultNamespace('user-1')

    expect(result).toBe('ns-user-1')
    expect(getK8sServiceForUser).toHaveBeenCalledWith('user-1')
  })

  it('rethrows errors from the underlying k8s service lookup', async () => {
    const error = new Error('missing kubeconfig')
    getK8sServiceForUser.mockRejectedValue(error)

    await expect(getUserDefaultNamespace('user-1')).rejects.toThrow(error)
  })
})
