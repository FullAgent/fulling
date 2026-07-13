import { describe, expect, it } from 'vitest'

import { formatUpdatedAt, parseKubeconfigStatus } from './kubeconfig-status'

describe('parseKubeconfigStatus', () => {
  it('keeps the public status fields', () => {
    expect(
      parseKubeconfigStatus({ configured: true, updatedAt: '2026-07-13T10:30:00.000Z' }),
    ).toEqual({ configured: true, updatedAt: '2026-07-13T10:30:00.000Z' })
  })

  it('rejects malformed responses', () => {
    expect(() => parseKubeconfigStatus(null)).toThrow('Invalid kubeconfig status response.')
    expect(() => parseKubeconfigStatus({ configured: 'yes', updatedAt: 123 })).toThrow(
      'Invalid kubeconfig status response.'
    )
  })
})

describe('formatUpdatedAt', () => {
  it('does not render invalid dates', () => {
    expect(formatUpdatedAt(null)).toBe('Not available')
    expect(formatUpdatedAt('not-a-date')).toBe('Not available')
  })
})
