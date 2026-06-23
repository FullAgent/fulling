import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectSealosIframe } from '@/lib/platform/integrations/sealos/auth/detect-sealos-iframe'

describe('detectSealosIframe', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when no window is provided', () => {
    expect(detectSealosIframe(undefined)).toBe(false)
  })

  it('returns false when the window has no ancestor origin', () => {
    expect(detectSealosIframe({ location: {} })).toBe(false)
  })

  it('returns true for sealos.io ancestor origins', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://cloud.sealos.io'],
        },
      }),
    ).toBe(true)
  })

  it('returns true for sealos.run ancestor origins', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://workspace.sealos.run'],
        },
      }),
    ).toBe(true)
  })

  it('returns false for non-Sealos ancestor origins', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://example.com'],
        },
      }),
    ).toBe(false)
  })

  it('returns false for spoofed Sealos-like ancestor hosts', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://sealos.io.evil.com'],
        },
      }),
    ).toBe(false)

    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://evil-sealos.run.example'],
        },
      }),
    ).toBe(false)

    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['https://example.com?next=sealos.io'],
        },
      }),
    ).toBe(false)
  })

  it('returns false for malformed ancestor origin strings', () => {
    expect(
      detectSealosIframe({
        location: {
          ancestorOrigins: ['not a url with sealos.io'],
        },
      }),
    ).toBe(false)
  })

  it('returns false when ancestor origin access throws', () => {
    const browserWindow = {
      location: {
        get ancestorOrigins() {
          throw new Error('blocked')
        },
      },
    }

    expect(detectSealosIframe(browserWindow)).toBe(false)
  })
})
