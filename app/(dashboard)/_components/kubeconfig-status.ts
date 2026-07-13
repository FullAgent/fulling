export type KubeconfigStatus = {
  configured: boolean
  updatedAt: string | null
}

export function parseKubeconfigStatus(value: unknown): KubeconfigStatus {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid kubeconfig status response.')
  }

  const { configured, updatedAt } = value as Record<string, unknown>
  if (
    typeof configured !== 'boolean' ||
    (updatedAt !== null && typeof updatedAt !== 'string')
  ) {
    throw new Error('Invalid kubeconfig status response.')
  }

  return { configured, updatedAt }
}

export function formatUpdatedAt(updatedAt: string | null): string {
  if (!updatedAt) {
    return 'Not available'
  }

  const date = new Date(updatedAt)
  return Number.isNaN(date.valueOf())
    ? 'Not available'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}
