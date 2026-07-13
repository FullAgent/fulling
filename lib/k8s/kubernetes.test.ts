import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getK8sServiceForUser } from './kubernetes'

const getKubeconfigContent = vi.hoisted(() => vi.fn())

vi.mock('@/lib/kubeconfig', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/kubeconfig')>()
  return { ...actual, getKubeconfigContent }
})

const config = (server: string) => `apiVersion: v1
kind: Config
clusters:
  - name: cluster
    cluster:
      server: ${server}
      insecure-skip-tls-verify: true
contexts:
  - name: context
    context:
      cluster: cluster
      user: user
current-context: context
users:
  - name: user
    user:
      token: token
`

describe('getK8sServiceForUser', () => {
  beforeEach(() => {
    getKubeconfigContent.mockReset()
  })

  it('throws the stable missing credential error', async () => {
    getKubeconfigContent.mockResolvedValue(null)

    await expect(getK8sServiceForUser('user-1')).rejects.toMatchObject({
      code: 'KUBECONFIG_REQUIRED',
    })
  })

  it('reads current content on every call', async () => {
    getKubeconfigContent
      .mockResolvedValueOnce(config('https://first.example.com'))
      .mockResolvedValueOnce(config('https://second.example.com'))

    const first = await getK8sServiceForUser('user-1')
    const second = await getK8sServiceForUser('user-1')

    expect(getKubeconfigContent).toHaveBeenCalledTimes(2)
    expect(first.kubeConfig.getCurrentCluster()?.server).toBe('https://first.example.com')
    expect(second.kubeConfig.getCurrentCluster()?.server).toBe('https://second.example.com')
  })

  it('scopes every lookup to the requested user', async () => {
    getKubeconfigContent.mockImplementation(async (userId: string) =>
      config(`https://${userId}.example.com`)
    )

    const first = await getK8sServiceForUser('user-1')
    const second = await getK8sServiceForUser('user-2')

    expect(first.kubeConfig.getCurrentCluster()?.server).toBe('https://user-1.example.com')
    expect(second.kubeConfig.getCurrentCluster()?.server).toBe('https://user-2.example.com')
  })
})
