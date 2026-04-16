/**
 * GET/POST/DELETE /api/sandbox/[id]/ports
 *
 * Manage custom exposed ports for a sandbox.
 *
 * GET    — Returns current exposed ports
 * POST   — Expose a new port (creates K8s Ingress + Service port)
 * DELETE — Unexpose a port (removes K8s Ingress + Service port)
 */

import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import { verifySandboxAccess, withAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { getK8sServiceForUser } from '@/lib/k8s/k8s-service-helper'
import { KubernetesUtils } from '@/lib/k8s/kubernetes-utils'
import { logger as baseLogger } from '@/lib/logger'

const logger = baseLogger.child({ module: 'api/sandbox/[id]/ports' })

interface ExposedPort {
  port: number
  url: string
}

// Built-in ports that cannot be exposed/unexposed by users
const BUILT_IN_PORTS = [3000, 3773, 7681, 8080]

function getExposedPorts(json: Prisma.JsonValue): ExposedPort[] {
  if (Array.isArray(json)) return json as unknown as ExposedPort[]
  return []
}

export const GET = withAuth(async (_req, context, session) => {
  const resolvedParams = await context.params
  const sandboxId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

  const sandbox = await verifySandboxAccess(sandboxId, session.user.id)
  const exposedPorts = getExposedPorts(sandbox.exposedPorts)

  return NextResponse.json({ ports: exposedPorts })
})

export const POST = withAuth<{ port?: number; url?: string; error?: string }>(async (req, context, session) => {
  const resolvedParams = await context.params
  const sandboxId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

  try {
    const body = await req.json()
    const port = Number(body.port)

    if (!port || port < 1 || port > 65535 || !Number.isInteger(port)) {
      return NextResponse.json({ error: 'Invalid port number (1-65535)' }, { status: 400 })
    }

    if (BUILT_IN_PORTS.includes(port)) {
      return NextResponse.json(
        { error: `Port ${port} is a built-in port and cannot be exposed manually` },
        { status: 400 }
      )
    }

    const sandbox = await verifySandboxAccess(sandboxId, session.user.id)
    const existingPorts = getExposedPorts(sandbox.exposedPorts)

    // Check if already exposed
    if (existingPorts.some((p) => p.port === port)) {
      const existing = existingPorts.find((p) => p.port === port)!
      return NextResponse.json({ port: existing.port, url: existing.url })
    }

    // Get project name for k8s labels
    const project = await prisma.project.findUnique({
      where: { id: sandbox.projectId },
      select: { name: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const k8sProjectName = KubernetesUtils.toK8sProjectName(project.name)
    const k8sService = await getK8sServiceForUser(session.user.id)

    // Expose port in K8s
    const url = await k8sService.exposePort(
      sandbox.k8sNamespace,
      sandbox.sandboxName,
      k8sProjectName,
      port
    )

    // Store in database
    const updatedPorts: Prisma.JsonArray = [...existingPorts, { port, url }] as unknown as Prisma.JsonArray
    await prisma.sandbox.update({
      where: { id: sandboxId },
      data: { exposedPorts: updatedPorts },
    })

    logger.info(`Port ${port} exposed for sandbox ${sandboxId}: ${url}`)
    return NextResponse.json({ port, url })
  } catch (error) {
    logger.error(`Failed to expose port for sandbox ${sandboxId}: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to expose port: ${errorMessage}` },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth<{ success?: boolean; error?: string }>(async (req, context, session) => {
  const resolvedParams = await context.params
  const sandboxId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id

  try {
    const body = await req.json()
    const port = Number(body.port)

    if (!port || port < 1 || port > 65535 || !Number.isInteger(port)) {
      return NextResponse.json({ error: 'Invalid port number (1-65535)' }, { status: 400 })
    }

    if (BUILT_IN_PORTS.includes(port)) {
      return NextResponse.json(
        { error: `Port ${port} is a built-in port and cannot be removed` },
        { status: 400 }
      )
    }

    const sandbox = await verifySandboxAccess(sandboxId, session.user.id)
    const existingPorts = getExposedPorts(sandbox.exposedPorts)

    // Check if port is actually exposed
    if (!existingPorts.some((p) => p.port === port)) {
      return NextResponse.json({ error: `Port ${port} is not exposed` }, { status: 404 })
    }

    const k8sService = await getK8sServiceForUser(session.user.id)

    // Unexpose port in K8s
    await k8sService.unexposePort(sandbox.k8sNamespace, sandbox.sandboxName, port)

    // Remove from database
    const updatedPorts: Prisma.JsonArray = existingPorts.filter((p) => p.port !== port) as unknown as Prisma.JsonArray
    await prisma.sandbox.update({
      where: { id: sandboxId },
      data: { exposedPorts: updatedPorts },
    })

    logger.info(`Port ${port} unexposed for sandbox ${sandboxId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(`Failed to unexpose port for sandbox ${sandboxId}: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to unexpose port: ${errorMessage}` },
      { status: 500 }
    )
  }
})
