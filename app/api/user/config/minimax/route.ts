/**
 * MiniMax Configuration API
 *
 * GET /api/user/config/minimax
 * - Get MiniMax API configuration
 * - Returns: { apiKey: string | null, apiBaseUrl: string | null, model: string | null }
 *
 * POST /api/user/config/minimax
 * - Save MiniMax API configuration
 * - Body: { apiBaseUrl: string, apiKey: string, model?: string }
 * - Returns: { success: true }
 */

import { NextRequest, NextResponse } from 'next/server'

import { type RouteContext, withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'api/user/config/minimax' })

const MINIMAX_API_KEY = 'MINIMAX_API_KEY'
const MINIMAX_API = 'MINIMAX_API'
const MINIMAX_MODEL = 'MINIMAX_MODEL'

type GetMiniMaxConfigResponse =
  | { error: string }
  | {
      apiKey: string | null
      apiBaseUrl: string | null
      model: string | null
    }

/**
 * GET /api/user/config/minimax
 * Get MiniMax API configuration
 */
export const GET = withAuth<GetMiniMaxConfigResponse>(
  async (_req: NextRequest, _context: RouteContext, session) => {
    try {
      const configs = await prisma.userConfig.findMany({
        where: {
          userId: session.user.id,
          key: {
            in: [MINIMAX_API_KEY, MINIMAX_API, MINIMAX_MODEL],
          },
        },
      })

      const apiKey = configs.find((c) => c.key === MINIMAX_API_KEY)?.value || null
      const apiBaseUrl = configs.find((c) => c.key === MINIMAX_API)?.value || null
      const model = configs.find((c) => c.key === MINIMAX_MODEL)?.value || null

      return NextResponse.json({
        apiKey,
        apiBaseUrl,
        model,
      })
    } catch (error) {
      logger.error(`Failed to fetch MiniMax config: ${error}`)
      return NextResponse.json(
        { error: 'Failed to fetch MiniMax configuration' },
        { status: 500 }
      )
    }
  }
)

/**
 * POST /api/user/config/minimax
 * Save MiniMax API configuration
 */
interface SaveMiniMaxConfigRequest {
  apiBaseUrl: string
  apiKey: string
  model?: string
}

type PostMiniMaxConfigResponse = { error: string } | { success: true; message: string }

export const POST = withAuth<PostMiniMaxConfigResponse>(
  async (req: NextRequest, _context: RouteContext, session) => {
    try {
      const body: SaveMiniMaxConfigRequest = await req.json()

      // Validate inputs
      if (!body.apiBaseUrl || typeof body.apiBaseUrl !== 'string') {
        return NextResponse.json({ error: 'API base URL is required' }, { status: 400 })
      }

      if (!body.apiKey || typeof body.apiKey !== 'string') {
        return NextResponse.json({ error: 'API key is required' }, { status: 400 })
      }

      // Validate URL format
      try {
        new URL(body.apiBaseUrl)
      } catch {
        return NextResponse.json({ error: 'Invalid API base URL format' }, { status: 400 })
      }

      // Execute all operations in a transaction
      await prisma.$transaction(async (tx) => {
        // Save API key
        await tx.userConfig.upsert({
          where: {
            userId_key: {
              userId: session.user.id,
              key: MINIMAX_API_KEY,
            },
          },
          create: {
            userId: session.user.id,
            key: MINIMAX_API_KEY,
            value: body.apiKey,
            category: 'minimax',
            isSecret: true,
          },
          update: {
            value: body.apiKey,
          },
        })

        // Save API base URL
        await tx.userConfig.upsert({
          where: {
            userId_key: {
              userId: session.user.id,
              key: MINIMAX_API,
            },
          },
          create: {
            userId: session.user.id,
            key: MINIMAX_API,
            value: body.apiBaseUrl,
            category: 'minimax',
            isSecret: false,
          },
          update: {
            value: body.apiBaseUrl,
          },
        })

        // Save or clear model if provided
        if (body.model !== undefined) {
          if (body.model === '' || body.model === null) {
            await tx.userConfig.deleteMany({
              where: {
                userId: session.user.id,
                key: MINIMAX_MODEL,
              },
            })
          } else {
            await tx.userConfig.upsert({
              where: {
                userId_key: {
                  userId: session.user.id,
                  key: MINIMAX_MODEL,
                },
              },
              create: {
                userId: session.user.id,
                key: MINIMAX_MODEL,
                value: body.model,
                category: 'minimax',
                isSecret: false,
              },
              update: {
                value: body.model,
              },
            })
          }
        }
      })

      logger.info(`MiniMax configuration saved for user ${session.user.id}`)

      return NextResponse.json({
        success: true,
        message: 'MiniMax configuration saved successfully',
      })
    } catch (error) {
      logger.error(`Failed to save MiniMax config: ${error}`)
      return NextResponse.json({ error: 'Failed to save MiniMax configuration' }, { status: 500 })
    }
  }
)
