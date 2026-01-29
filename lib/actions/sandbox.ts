'use server'

/**
 * Sandbox Server Actions
 *
 * Server Actions for sandbox operations. Frontend components call these
 * instead of API Routes directly.
 *
 * TODO: Migrate from app/api/sandbox/:
 *   - app-status (GET/DELETE)
 *   - exec (POST)
 *   - cwd (GET/PUT)
 */

import { auth } from '@/lib/auth'
import { getSandboxTtydContext } from '@/lib/util/ttyd-context'
import { execCommand, TtydExecError } from '@/lib/util/ttyd-exec'

import type { ExecResult } from './types'

/**
 * Execute a command in the sandbox and wait for output.
 *
 * @param sandboxId - The sandbox ID
 * @param command - The command to execute
 * @param timeoutMs - Optional timeout in milliseconds (default: 30000)
 */
export async function runCommand(
  sandboxId: string,
  command: string,
  timeoutMs?: number
): Promise<ExecResult> {
  const session = await auth()

  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const { ttyd } = await getSandboxTtydContext(sandboxId, session.user.id)
    const { baseUrl, accessToken, authorization } = ttyd

    const output = await execCommand(baseUrl, accessToken, command, timeoutMs, authorization)

    return { success: true, output }
  } catch (error) {
    console.error('Failed to execute command in sandbox:', error)
    const errorMessage = error instanceof TtydExecError ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

/**
 * Execute a command in the sandbox without waiting for output.
 *
 * @param sandboxId - The sandbox ID
 * @param command - The command to execute
 */
export async function runCommandDetached(
  _sandboxId: string,
  _command: string
): Promise<ExecResult> {
  // TODO: Implement detached command execution
  throw new Error('Not implemented')
}
