/**
 * POST /api/sandbox/[id]/exec
 *
 * Execute a command in the sandbox background.
 * Runs command with nohup, returns PID immediately.
 *
 * Request Body:
 * - command: Command to execute (required)
 * - workdir: Working directory (optional, default: /home/fulling)
 *
 * Returns:
 * - success: Whether execution was successful
 * - pid: Process ID
 * - error: Error message if failed
 *
 * Security:
 * - Requires authentication
 * - Verifies user owns the sandbox
 */

import { NextResponse } from 'next/server'

import { verifySandboxAccess, withAuth } from '@/lib/api-auth'
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'api/sandbox/[id]/exec' })

interface ExecRequestBody {
  command: string
  workdir?: string
}

interface ExecResponse {
  success: boolean
  pid?: number
  error?: string
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

    // Verify user owns this sandbox
    const sandbox = await verifySandboxAccess(sandboxId, session.user.id)

    logger.info(
      `Executing background command in sandbox ${sandboxId} (${sandbox.sandboxName}): "${body.command}"`
    )

    // Get K8s service for user
    const k8sService = await getK8sServiceForUser(session.user.id)

    // Execute command in sandbox background
    const result = await k8sService.execCommandInBackground(
      sandbox.k8sNamespace,
      sandbox.sandboxName,
      body.command,
      body.workdir
    )

    if (result.success) {
      logger.info(`Command started in sandbox ${sandboxId} (PID: ${result.pid})`)
    } else {
      logger.warn(`Command execution failed in sandbox ${sandboxId}: ${result.error}`)
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    logger.error(`Failed to execute command in sandbox: ${error}`)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Failed to execute command: ${errorMessage}` },
      { status: 500 }
    )
  }
})
