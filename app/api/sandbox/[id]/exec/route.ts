/**
 * POST /api/sandbox/[id]/exec
 *
 * Execute a command in the sandbox background.
 * Uses ttyd WebSocket to run the command with nohup for persistence.
 *
 * Request Body:
 * - command: Command to execute (required)
 * - workdir: Working directory (optional, default: /home/fulling)
 *
 * Returns:
 * - success: Whether execution was initiated successfully
 * - error: Error message if failed
 *
 * Security:
 * - Requires authentication
 * - Verifies user owns the sandbox
 */

import { NextResponse } from 'next/server'

import { withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { logger as baseLogger } from '@/lib/logger'
import { executeTtydCommand, TtydExecError } from '@/lib/util/ttyd-exec'

const logger = baseLogger.child({ module: 'api/sandbox/[id]/exec' })

interface ExecRequestBody {
  command: string
  workdir?: string
}

interface ExecResponse {
  success: boolean
  error?: string
}

/**
 * Get ttyd context for a sandbox
 * Returns the base URL and access token needed for ttyd-exec
 */
async function getTtydContext(sandboxId: string, userId: string) {
  // security measure: verify user owns this sandbox through project
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

  const ttydAccessToken = sandbox.project.environments.find(
    (env) => env.key === 'TTYD_ACCESS_TOKEN'
  )?.value

  if (!sandbox.ttydUrl || !ttydAccessToken) {
    throw new Error('Sandbox configuration missing')
  }

  // Parse the ttydUrl to get base URL (without query params)
  const ttydBaseUrl = new URL(sandbox.ttydUrl)
  
  // Extract authorization param if present
  const authorization = ttydBaseUrl.searchParams.get('authorization') || undefined
  
  ttydBaseUrl.search = '' // Remove query params
  const baseUrl = ttydBaseUrl.toString().replace(/\/$/, '')

  return { baseUrl, accessToken: ttydAccessToken, authorization, sandbox }
}

export const POST = withAuth<ExecResponse>(async (req, context, session) => {
  const resolvedParams = await context.params
  const sandboxId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

  try {
    // Parse request body
    const body: ExecRequestBody = await req.json()

    if (!body.command) {
      logger.warn(`Missing command in request body for sandbox ${sandboxId}`)
      return NextResponse.json({ success: false, error: 'command is required' }, { status: 400 })
    }

    // Get ttyd context (validates ownership and gets credentials)
    const { baseUrl, accessToken, authorization, sandbox } = await getTtydContext(
      sandboxId,
      session.user.id
    )

    const workdir = body.workdir || '/home/fulling'
    const timestamp = Date.now()

    logger.info(
      `Executing background command in sandbox ${sandboxId} (${sandbox.sandboxName}): "${body.command}"`
    )

    // Build the background execution command
    // nohup ensures the process continues after ttyd session ends
    // Output is redirected to a log file for debugging
    const bgCommand = `cd "${workdir}" && mkdir -p /tmp/exec-logs && nohup ${body.command} > /tmp/exec-logs/${timestamp}.log 2>&1 &`

    // Execute the command via ttyd WebSocket
    // The command returns almost immediately since it runs in background
    const result = await executeTtydCommand({
      ttydUrl: baseUrl,
      accessToken,
      authorization,
      command: bgCommand,
      timeoutMs: 10000, // 10 second timeout should be plenty for nohup to start
    })

    if (result.timedOut) {
      logger.warn(`Command timed out in sandbox ${sandboxId}`)
      return NextResponse.json(
        { success: false, error: 'Command execution timed out' },
        { status: 500 }
      )
    }

    logger.info(`Background command started in sandbox ${sandboxId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`Failed to execute command in sandbox: ${error}`)

    let errorMessage = 'Unknown error'
    if (error instanceof TtydExecError) {
      errorMessage = `ttyd error (${error.code}): ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { success: false, error: `Failed to execute command: ${errorMessage}` },
      { status: 500 }
    )
  }
})
