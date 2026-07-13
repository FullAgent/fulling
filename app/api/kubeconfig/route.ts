import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/session'
import { validateKubeconfig } from '@/lib/k8s'
import {
  getKubeconfigStatus,
  InvalidKubeconfigError,
  KubeconfigValidationError,
  removeKubeconfig,
  saveKubeconfig,
} from '@/lib/kubeconfig'
import { logger } from '@/lib/logger'

const unauthorized = () =>
  NextResponse.json({ code: 'UNAUTHORIZED', message: 'Sign in to continue.' }, { status: 401 })

export async function GET() {
  const session = await getSession()
  if (!session) {
    return unauthorized()
  }

  try {
    const status = await getKubeconfigStatus(session.user.id)
    return NextResponse.json({
      configured: status.configured,
      updatedAt: status.updatedAt?.toISOString() ?? null,
    })
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Failed to read kubeconfig status')
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Could not read kubeconfig status.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) {
    return unauthorized()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { code: 'INVALID_KUBECONFIG', message: 'Send a valid JSON request.' },
      { status: 400 }
    )
  }

  const content =
    body && typeof body === 'object' && 'content' in body
      ? (body as { content?: unknown }).content
      : undefined

  if (typeof content !== 'string') {
    return NextResponse.json(
      { code: 'INVALID_KUBECONFIG', message: 'Enter a kubeconfig to continue.' },
      { status: 400 }
    )
  }

  try {
    const validation = await validateKubeconfig(content)
    const updatedAt = await saveKubeconfig(session.user.id, content)

    logger.info(
      {
        apiServerOrigin: validation.apiServerOrigin,
        namespace: validation.namespace,
        userId: session.user.id,
      },
      'Saved kubeconfig'
    )

    return NextResponse.json({ configured: true, updatedAt: updatedAt.toISOString() })
  } catch (error) {
    if (error instanceof InvalidKubeconfigError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: 400 })
    }

    if (error instanceof KubeconfigValidationError) {
      logger.warn({ userId: session.user.id }, 'Kubeconfig validation failed')
      return NextResponse.json({ code: error.code, message: error.message }, { status: 422 })
    }

    logger.error({ error, userId: session.user.id }, 'Failed to save kubeconfig')
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Could not save kubeconfig.' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return unauthorized()
  }

  try {
    await removeKubeconfig(session.user.id)
    logger.info({ userId: session.user.id }, 'Deleted kubeconfig')
    return NextResponse.json({ configured: false, updatedAt: null })
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Failed to delete kubeconfig')
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Could not delete kubeconfig.' },
      { status: 500 }
    )
  }
}
