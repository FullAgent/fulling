import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'

import { refreshUserToken, shouldRefreshToken } from './github-app'

const logger = baseLogger.child({ module: 'lib/services/github-token-refresh' })

interface TokenMetadata {
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  token?: string // Old format
  [key: string]: unknown
}

/**
 * Get user's GitHub access token, refreshing if necessary
 * Returns null if user has no GitHub identity or refresh fails
 */
export async function getUserGitHubToken(userId: string): Promise<string | null> {
  try {
    const identity = await prisma.userIdentity.findFirst({
      where: { userId, provider: 'GITHUB' },
    })

    if (!identity) {
      return null
    }

    const metadata = identity.metadata as TokenMetadata

    // Check if using new token format
    if (!metadata.accessToken || !metadata.refreshToken || !metadata.expiresAt) {
      // Old format - return legacy token
      return (metadata.token as string) || null
    }

    // Check if token needs refresh (proactive: 1 hour before expiry)
    if (shouldRefreshToken(metadata.expiresAt)) {
      logger.info(`Refreshing GitHub token for user ${userId}`)

      try {
        const newTokens = await refreshUserToken(metadata.refreshToken)

        // Update metadata with new tokens
        await prisma.userIdentity.update({
          where: { id: identity.id },
          data: {
            metadata: {
              ...metadata,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
              expiresAt: newTokens.expiresAt,
            },
          },
        })

        logger.info(`GitHub token refreshed successfully for user ${userId}`)
        return newTokens.accessToken
      } catch (error) {
        logger.error(`Failed to refresh GitHub token for user ${userId}: ${error}`)
        // Return expired token (GitHub API will return 401, triggering re-auth)
        return metadata.accessToken
      }
    }

    return metadata.accessToken
  } catch (error) {
    logger.error(`Error getting GitHub token for user ${userId}: ${error}`)
    return null
  }
}
