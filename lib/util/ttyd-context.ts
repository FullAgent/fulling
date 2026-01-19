/**
 * TTYD Context Utilities
 *
 * Helper functions to get TTYD connection context for sandboxes.
 */

import { prisma } from '@/lib/db'

// =============================================================================
// Types
// =============================================================================

export interface TtydContext {
  baseUrl: string
  accessToken: string
  authorization?: string
}

export interface SandboxTtydContext {
  ttyd: TtydContext
  sandbox: Awaited<ReturnType<typeof getSandboxWithTtyd>>
}

// =============================================================================
// Internal Helpers
// =============================================================================

async function getSandboxWithTtyd(sandboxId: string, userId: string) {
  const sandbox = await prisma.sandbox.findFirst({
    where: {
      id: sandboxId,
      project: {
        userId: userId,
      },
    },
    include: {
      project: {
        include: {
          environments: true,
        },
      },
    },
  })

  if (!sandbox) {
    throw new Error('Sandbox not found')
  }

  return sandbox
}

// =============================================================================
// Public Functions
// =============================================================================

/**
 * Get TTYD connection context for a sandbox.
 * Verifies the sandbox belongs to the specified user.
 *
 * @param sandboxId - The sandbox ID
 * @param userId - The user ID (for ownership verification)
 * @returns TTYD connection context with baseUrl, accessToken, and sandbox
 */
export async function getSandboxTtydContext(
  sandboxId: string,
  userId: string
): Promise<SandboxTtydContext> {
  const sandbox = await getSandboxWithTtyd(sandboxId, userId)

  const accessToken = sandbox.project.environments.find(
    (env) => env.key === 'TTYD_ACCESS_TOKEN'
  )?.value

  if (!sandbox.ttydUrl || !accessToken) {
    throw new Error('Sandbox TTYD not configured')
  }

  // Parse the ttydUrl to get base URL (without query params)
  const ttydBaseUrl = new URL(sandbox.ttydUrl)
  const authorization = ttydBaseUrl.searchParams.get('authorization') || undefined
  ttydBaseUrl.search = ''
  const baseUrl = ttydBaseUrl.toString().replace(/\/$/, '')

  const ttyd = { baseUrl, accessToken, authorization }

  return { ttyd, sandbox }
}
