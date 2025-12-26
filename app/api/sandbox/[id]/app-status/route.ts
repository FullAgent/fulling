/**
 * GET /api/sandbox/[id]/app-status
 * Check if application is running (port 3000 listening)
 *
 * DELETE /api/sandbox/[id]/app-status
 * Stop the application (kill process on port 3000)
 */

import { NextResponse } from 'next/server'

import { verifySandboxAccess, withAuth } from '@/lib/api-auth'
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'api/sandbox/[id]/app-status' })
const APP_PORT = 3000

export const GET = withAuth<{ running: boolean }>(async (req, context, session) => {
  const resolvedParams = await context.params
  const sandboxId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

  try {
    const sandbox = await verifySandboxAccess(sandboxId, session.user.id)
    const k8sService = await getK8sServiceForUser(session.user.id)

    const running = await k8sService.isPortListening(
      sandbox.k8sNamespace,
      sandbox.sandboxName,
      APP_PORT
    )

    return NextResponse.json({ running })
  } catch (error) {
    logger.error(`Failed to check app status: ${error}`)
    return NextResponse.json({ running: false })
  }
})

export const DELETE = withAuth<{ success: boolean; error?: string }>(
  async (req, context, session) => {
    const resolvedParams = await context.params
    const sandboxId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

    try {
      const sandbox = await verifySandboxAccess(sandboxId, session.user.id)
      const k8sService = await getK8sServiceForUser(session.user.id)

      logger.info(`Stopping app in sandbox ${sandboxId} (${sandbox.sandboxName})`)

      const result = await k8sService.killProcessOnPort(
        sandbox.k8sNamespace,
        sandbox.sandboxName,
        APP_PORT
      )

      if (result.success) {
        logger.info(`App stopped in sandbox ${sandboxId}`)
      } else {
        logger.warn(`Failed to stop app in sandbox ${sandboxId}: ${result.error}`)
      }

      return NextResponse.json(result)
    } catch (error) {
      logger.error(`Failed to stop app: ${error}`)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  }
)
