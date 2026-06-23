import { createSealosApp, sealosApp } from '@zjy365/sealos-desktop-sdk/app'

import type { SealosAuthSession } from './types'

/**
 * Loads the current Sealos Desktop auth session.
 *
 * Expected inputs:
 * - Must run in a Sealos Desktop iframe after the caller has detected Sealos.
 *
 * Expected outputs:
 * - Returns normalized token, kubeconfig, user, namespace, and cleanup values.
 *
 * Out of scope:
 * - Does not decide whether the current browser is in Sealos.
 * - Does not authenticate the Fulling NextAuth session.
 */
export async function getSealosSession(): Promise<SealosAuthSession> {
  const cleanupApp = createSealosApp()
  let sealosSession: Awaited<ReturnType<typeof sealosApp.getSession>>

  try {
    sealosSession = await sealosApp.getSession()
  } catch (error) {
    cleanupApp?.()
    throw error
  }

  if (!sealosSession.token) {
    cleanupApp?.()
    throw new Error('Sealos session token is missing')
  }

  return {
    token: sealosSession.token,
    kubeconfig: sealosSession.kubeconfig,
    user: sealosSession.user,
    namespaceId: sealosSession.user.nsid,
    cleanup: cleanupApp ?? (() => {}),
  }
}
