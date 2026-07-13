import * as k8s from '@kubernetes/client-node'
import { load } from 'js-yaml'
import fetch from 'node-fetch'

import {
  InvalidKubeconfigError,
  KubeconfigValidationError,
} from '@/lib/kubeconfig/errors'

const MAX_KUBECONFIG_BYTES = 256 * 1024
const VALIDATION_TIMEOUT_MS = 10_000

const allowedClusterFields = new Set([
  'certificate-authority-data',
  'server',
  'tls-server-name',
])
const allowedUserFields = new Set([
  'client-certificate-data',
  'client-key-data',
  'password',
  'token',
  'username',
])

type RawNamedEntry = {
  cluster?: unknown
  user?: unknown
}

type RawKubeconfig = {
  clusters?: unknown
  users?: unknown
}

export type ValidatedKubeconfig = {
  apiServerOrigin: string
  namespace: string
  username: string
}

function parseRawKubeconfig(content: string): RawKubeconfig {
  let parsed: unknown
  try {
    parsed = load(content)
  } catch {
    throw new InvalidKubeconfigError('The kubeconfig is not valid YAML.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new InvalidKubeconfigError('The kubeconfig must be a YAML object.')
  }

  return parsed as RawKubeconfig
}

function assertRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidKubeconfigError(`Kubeconfig field ${field} must be an object.`)
  }
  return value as Record<string, unknown>
}

function rejectUnsafeCredentialSources(config: RawKubeconfig): void {
  if (!Array.isArray(config.clusters) || !Array.isArray(config.users)) {
    throw new InvalidKubeconfigError('The kubeconfig must define clusters and users.')
  }

  for (const entryValue of config.clusters) {
    const entry = assertRecord(entryValue, 'clusters[]') as RawNamedEntry
    const cluster = assertRecord(entry.cluster, 'clusters[].cluster')
    for (const [field, value] of Object.entries(cluster)) {
      if (!allowedClusterFields.has(field)) {
        throw new InvalidKubeconfigError(
          `Kubeconfig field clusters[].cluster.${field} is not supported.`
        )
      }
      if (typeof value !== 'string') {
        throw new InvalidKubeconfigError(
          `Kubeconfig field clusters[].cluster.${field} has an invalid value.`
        )
      }
    }
  }

  for (const entryValue of config.users) {
    const entry = assertRecord(entryValue, 'users[]') as RawNamedEntry
    const user = assertRecord(entry.user, 'users[].user')
    for (const [field, value] of Object.entries(user)) {
      if (!allowedUserFields.has(field)) {
        throw new InvalidKubeconfigError(`Kubeconfig field users[].user.${field} is not supported.`)
      }
      if (typeof value !== 'string') {
        throw new InvalidKubeconfigError(
          `Kubeconfig field users[].user.${field} has an invalid value.`
        )
      }
    }
  }
}

function parseKubeconfig(content: string): {
  apiServer: URL
  kubeConfig: k8s.KubeConfig
  namespace: string
} {
  rejectUnsafeCredentialSources(parseRawKubeconfig(content))

  const kubeConfig = new k8s.KubeConfig()
  try {
    kubeConfig.loadFromString(content)
  } catch {
    throw new InvalidKubeconfigError('The kubeconfig could not be parsed.')
  }

  const currentContext = kubeConfig.getCurrentContext()
  const context = currentContext ? kubeConfig.getContextObject(currentContext) : null
  if (!context) {
    throw new InvalidKubeconfigError('The kubeconfig has no valid current context.')
  }

  const cluster = kubeConfig.getCluster(context.cluster)
  if (!cluster) {
    throw new InvalidKubeconfigError('The current context references a missing cluster.')
  }

  if (!context.user || !kubeConfig.getUser(context.user)) {
    throw new InvalidKubeconfigError('The current context references a missing user.')
  }

  let apiServer: URL
  try {
    apiServer = new URL(cluster.server)
  } catch {
    throw new InvalidKubeconfigError('The Kubernetes API server URL is invalid.')
  }

  if (apiServer.protocol !== 'https:') {
    throw new InvalidKubeconfigError('The Kubernetes API server must use HTTPS.')
  }

  return {
    apiServer,
    kubeConfig,
    namespace: context.namespace || 'default',
  }
}

export async function validateKubeconfig(content: unknown): Promise<ValidatedKubeconfig> {
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new InvalidKubeconfigError('Enter a kubeconfig to continue.')
  }

  if (Buffer.byteLength(content, 'utf8') > MAX_KUBECONFIG_BYTES) {
    throw new InvalidKubeconfigError('The kubeconfig must be 256 KiB or smaller.')
  }

  const { apiServer, kubeConfig, namespace } = parseKubeconfig(content)
  const endpoint = new URL('/apis/authentication.k8s.io/v1/selfsubjectreviews', apiServer)

  try {
    const requestOptions = await kubeConfig.applyToFetchOptions({
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
    const response = await fetch(endpoint, {
      ...requestOptions,
      body: JSON.stringify({
        apiVersion: 'authentication.k8s.io/v1',
        kind: 'SelfSubjectReview',
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new KubeconfigValidationError()
    }

    const body = (await response.json()) as {
      status?: { userInfo?: { username?: unknown } }
    }
    const username = body.status?.userInfo?.username
    if (typeof username !== 'string' || !username || username === 'system:anonymous') {
      throw new KubeconfigValidationError()
    }

    return {
      apiServerOrigin: apiServer.origin,
      namespace,
      username,
    }
  } catch (error) {
    if (error instanceof KubeconfigValidationError) {
      throw error
    }
    throw new KubeconfigValidationError()
  }
}
