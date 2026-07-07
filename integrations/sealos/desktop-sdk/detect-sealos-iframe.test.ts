import { afterEach, describe, expect, it, vi } from 'vitest'

import { detectSealosIframe } from '@/integrations/sealos/desktop-sdk/detect-sealos-iframe'

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

  it('returns false for Sealos origins when the window is not framed', () => {
    const browserWindow = {
      self: 'same-frame',
      top: 'same-frame',
      location: {
        ancestorOrigins: ['https://cloud.sealos.io'],
      },
    }

    expect(detectSealosIframe(browserWindow)).toBe(false)
  })

  it('returns true for sealos.io ancestor origins', () => {
    expect(
      detectSealosIframe({
        self: 'child-frame',
        top: 'parent-frame',
        location: {
          ancestorOrigins: ['https://cloud.sealos.io'],
        },
      }),
    ).toBe(true)
  })

  it('returns true for sealos.run ancestor origins', () => {
    expect(
      detectSealosIframe({
        self: 'child-frame',
        top: 'parent-frame',
        location: {
          ancestorOrigins: ['https://workspace.sealos.run'],
        },
      }),
    ).toBe(true)
  })

  it('returns false for non-Sealos ancestor origins', () => {
    expect(
      detectSealosIframe({
        self: 'child-frame',
        top: 'parent-frame',
        location: {
          ancestorOrigins: ['https://example.com'],
        },
      }),
    ).toBe(false)
  })

  it('returns false for spoofed Sealos-like ancestor hosts', () => {
    expect(
      detectSealosIframe({
        self: 'child-frame',
        top: 'parent-frame',
        location: {
          ancestorOrigins: ['https://sealos.io.evil.com'],
        },
      }),
    ).toBe(false)

    expect(
      detectSealosIframe({
        self: 'child-frame',
        top: 'parent-frame',
        location: {
          ancestorOrigins: ['https://evil-sealos.run.example'],
        },
      }),
    ).toBe(false)

    expect(
      detectSealosIframe({
        self: 'child-frame',
        top: 'parent-frame',
        location: {
          ancestorOrigins: ['https://example.com?next=sealos.io'],
        },
      }),
    ).toBe(false)
  })

  it('returns false for malformed ancestor origin strings', () => {
    expect(
      detectSealosIframe({
        self: 'child-frame',
        top: 'parent-frame',
        location: {
          ancestorOrigins: ['not a url with sealos.io'],
        },
      }),
    ).toBe(false)
  })

  it('returns false when ancestor origin access throws', () => {
    const browserWindow = {
      self: 'child-frame',
      top: 'parent-frame',
      location: {
        get ancestorOrigins() {
          throw new Error('blocked')
        },
      },
    } as Parameters<typeof detectSealosIframe>[0]

    expect(detectSealosIframe(browserWindow)).toBe(false)
  })
})
