/**
 * Terminal Exec Test Page
 *
 * Test page for verifying the ttyd-exec utility works in the browser.
 * Accessible at: /projects/[id]/exec-test
 */

import { notFound,redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { TtydExecTestClient } from './client'

export default async function ExecTestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  // Get project with sandbox
  const project = await prisma.project.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      sandboxes: true,
      environments: true,
    },
  })

  if (!project) {
    notFound()
  }

  const sandbox = project.sandboxes[0]

  // Get TTYD access token from environments
  const ttydAccessToken = project.environments.find(
    (env) => env.key === 'TTYD_ACCESS_TOKEN'
  )?.value

  if (!sandbox?.ttydUrl || !ttydAccessToken) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-gray-900 text-white rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Configuration Missing</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <strong>ttydUrl:</strong> {sandbox?.ttydUrl || 'Not available'}
            </p>
            <p>
              <strong>accessToken:</strong> {ttydAccessToken ? 'Configured' : 'Not configured'}
            </p>
            <p>
              <strong>Sandbox Status:</strong> {sandbox?.status || 'No sandbox'}
            </p>
          </div>
          <p className="mt-4 text-yellow-400 text-sm">
            Make sure the sandbox is RUNNING and TTYD_ACCESS_TOKEN is set in environments.
          </p>
        </div>
      </div>
    )
  }

  // Parse the ttydUrl to get base URL (without query params)
  const ttydBaseUrl = new URL(sandbox.ttydUrl)
  ttydBaseUrl.search = '' // Remove query params
  const baseUrl = ttydBaseUrl.toString().replace(/\/$/, '')

  return (
    <div className="p-8 overflow-auto h-full">
      <TtydExecTestClient ttydUrl={baseUrl} accessToken={ttydAccessToken} />
    </div>
  )
}