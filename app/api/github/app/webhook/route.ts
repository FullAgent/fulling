import { NextRequest, NextResponse } from 'next/server'

import { logger as baseLogger } from '@/lib/logger'
import { getInstallationByGitHubId, updateInstallationStatus } from '@/lib/repo/github'
import { invalidateInstallationToken, verifyWebhookSignature } from '@/lib/services/github-app'

const logger = baseLogger.child({ module: 'api/github/app/webhook' })

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-hub-signature-256') || ''
    const event = request.headers.get('x-github-event') || ''

    if (!verifyWebhookSignature(payload, signature)) {
      logger.warn('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(payload)
    const action = body.action as string

    logger.info(`Webhook received: ${event}.${action}`)

    if (event === 'installation') {
      await handleInstallationEvent(action, body)
    } else {
      logger.info(`Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error(`Webhook processing error: ${error}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleInstallationEvent(
  action: string,
  body: {
    installation: {
      id: number
      account: { id: number; login: string; type: string; avatar_url: string }
      repository_selection: string
      permissions: Record<string, string>
      events: string[]
    }
  }
) {
  const inst = body.installation

  switch (action) {
    case 'created': {
      const existing = await getInstallationByGitHubId(inst.id)
      if (existing) {
        logger.info(`Installation ${inst.id} already exists (created via callback)`)
      } else {
        logger.info(`Installation ${inst.id} created via webhook (no callback user — skipping)`)
      }
      break
    }
    case 'deleted':
      await updateInstallationStatus(inst.id, 'DELETED')
      invalidateInstallationToken(inst.id)
      logger.info(`Installation ${inst.id} deleted`)
      break
    case 'suspend':
      await updateInstallationStatus(inst.id, 'SUSPENDED')
      invalidateInstallationToken(inst.id)
      logger.info(`Installation ${inst.id} suspended`)
      break
    case 'unsuspend':
      await updateInstallationStatus(inst.id, 'ACTIVE', null)
      logger.info(`Installation ${inst.id} unsuspended`)
      break
    default:
      logger.info(`Unhandled installation action: ${action}`)
  }
}
