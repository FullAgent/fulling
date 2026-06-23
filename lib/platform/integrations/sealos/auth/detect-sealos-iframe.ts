type BrowserWindowLike = {
  location?: {
    ancestorOrigins?: ArrayLike<string>
  }
}

/**
 * Detects whether the current browser frame is embedded by Sealos.
 *
 * Expected inputs:
 * - A browser `window` object, or no value in server/test environments.
 *
 * Expected outputs:
 * - Returns true when the first ancestor origin is a known Sealos host.
 *
 * Out of scope:
 * - Does not initialize the Sealos SDK.
 * - Does not authenticate the Fulling user.
 */
export function detectSealosIframe(browserWindow?: BrowserWindowLike): boolean {
  if (!browserWindow) return false

  try {
    const ancestorOrigin = browserWindow.location?.ancestorOrigins?.[0]
    if (!ancestorOrigin) return false

    const hostname = new URL(ancestorOrigin).hostname

    return (
      hostname === 'sealos.io' ||
      hostname.endsWith('.sealos.io') ||
      hostname === 'sealos.run' ||
      hostname.endsWith('.sealos.run')
    )
  } catch {
    return false
  }
}
