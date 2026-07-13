import fetch from 'node-fetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidKubeconfigError, KubeconfigValidationError } from '@/lib/kubeconfig/errors'

import { validateKubeconfig } from './validate-kubeconfig'

vi.mock('node-fetch', () => ({ default: vi.fn() }))

const mockedFetch = vi.mocked(fetch)

function kubeconfig(overrides = ''): string {
  return `apiVersion: v1
kind: Config
clusters:
  - name: test
    cluster:
      server: https://cluster.example.com
contexts:
  - name: test
    context:
      cluster: test
      user: test
current-context: test
users:
  - name: test
    user:
      token: test-token
${overrides}`
}

describe('validateKubeconfig', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it.each([
    ['exec', '      exec:\n        command: credential-plugin'],
    ['auth-provider', '      auth-provider:\n        name: oidc'],
    ['tokenFile', '      tokenFile: /var/run/secrets/token'],
    ['client-key', '      client-key: /etc/ssl/private/key.pem'],
    ['impersonation', '      impersonate-user: system:admin'],
    ['unknown field', '      future-credential-plugin: enabled'],
  ])('rejects the %s credential source before connecting', async (_name, field) => {
    await expect(validateKubeconfig(kubeconfig(field))).rejects.toBeInstanceOf(
      InvalidKubeconfigError
    )
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('rejects proxy and local CA configuration before connecting', async () => {
    for (const field of [
      '      proxy-url: http://proxy.internal',
      '      certificate-authority: /etc/kubernetes/ca.crt',
    ]) {
      const content = kubeconfig().replace(
        '      server: https://cluster.example.com',
        `      server: https://cluster.example.com\n${field}`
      )

      await expect(validateKubeconfig(content)).rejects.toBeInstanceOf(InvalidKubeconfigError)
    }
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('rejects malformed credential collections', async () => {
    const content = kubeconfig().replace('users:\n  - name: test', 'users: invalid')

    await expect(validateKubeconfig(content)).rejects.toBeInstanceOf(InvalidKubeconfigError)
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('requires an HTTPS API server', async () => {
    const content = kubeconfig().replace('https://cluster.example.com', 'http://cluster.example.com')

    await expect(validateKubeconfig(content)).rejects.toMatchObject({
      code: 'INVALID_KUBECONFIG',
    })
  })

  it('returns non-sensitive identity and context details', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: { userInfo: { username: 'github-user' } } }),
    } as never)

    await expect(validateKubeconfig(kubeconfig())).resolves.toEqual({
      apiServerOrigin: 'https://cluster.example.com',
      namespace: 'default',
      username: 'github-user',
    })

    expect(mockedFetch).toHaveBeenCalledWith(
      new URL('https://cluster.example.com/apis/authentication.k8s.io/v1/selfsubjectreviews'),
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        signal: expect.any(AbortSignal),
      })
    )
  })

  it('rejects anonymous identity', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: { userInfo: { username: 'system:anonymous' } } }),
    } as never)

    await expect(validateKubeconfig(kubeconfig())).rejects.toBeInstanceOf(
      KubeconfigValidationError
    )
  })
})
