import crypto from 'crypto'
import jwt from 'jsonwebtoken'

import { env } from '@/lib/env'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'lib/services/github-app' })

const GITHUB_API_BASE = 'https://api.github.com'

const tokenCache = new Map<number, { token: string; expiresAt: number }>()

const TOKEN_CACHE_TTL_MS = 50 * 60 * 1000

function resolvePrivateKey(raw: string): string {
  if (!raw.includes('-----BEGIN')) {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    if (decoded.includes('-----BEGIN')) {
      return decoded
    }
  }
  return raw.replace(/\\n/g, '\n')
}

function generateAppJWT(): string {
  const appId = env.GITHUB_APP_ID
  const rawKey = env.GITHUB_APP_PRIVATE_KEY

  if (!appId || !rawKey) {
    throw new Error('GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be configured')
  }

  const privateKey = resolvePrivateKey(rawKey)
  const now = Math.floor(Date.now() / 1000)

  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 10 * 60,
      iss: appId,
    },
    privateKey,
    { algorithm: 'RS256' }
  )
}

export async function getInstallationToken(installationId: number): Promise<string> {
  const cached = tokenCache.get(installationId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token
  }

  const appJwt = generateAppJWT()

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(`Failed to get installation token for ${installationId}: ${response.status} ${errorText}`)
    throw new Error(`Failed to get installation token: ${response.status}`)
  }

  const data = await response.json()
  const token = data.token as string

  tokenCache.set(installationId, {
    token,
    expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
  })

  logger.info(`Installation token generated for installation ${installationId}`)
  return token
}

export function invalidateInstallationToken(installationId: number): void {
  tokenCache.delete(installationId)
}

export async function getInstallationDetails(installationId: number) {
  const appJwt = generateAppJWT()

  const response = await fetch(`${GITHUB_API_BASE}/app/installations/${installationId}`, {
    headers: {
      Authorization: `Bearer ${appJwt}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error(`Failed to get installation details for ${installationId}: ${response.status} ${errorText}`)
    throw new Error(`Failed to get installation details: ${response.status}`)
  }

  return response.json()
}

export async function listInstallationRepos(installationId: number) {
  const token = await getInstallationToken(installationId)
  const repos = []
  let page = 1
  const perPage = 100

  while (true) {
    const response = await fetch(
      `${GITHUB_API_BASE}/installation/repositories?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Failed to list installation repos: ${response.status} ${errorText}`)
      throw new Error(`Failed to list installation repos: ${response.status}`)
    }

    const data = await response.json()
    repos.push(...data.repositories)

    if (data.repositories.length < perPage) break
    page++
  }

  return repos
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = env.GITHUB_APP_WEBHOOK_SECRET
  if (!secret) {
    logger.error('GITHUB_APP_WEBHOOK_SECRET is not configured')
    return false
  }

  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')

  const expected = Buffer.from(expectedSignature)
  const received = Buffer.from(signature)

  if (expected.byteLength !== received.byteLength) {
    return false
  }

  return crypto.timingSafeEqual(expected, received)
}
