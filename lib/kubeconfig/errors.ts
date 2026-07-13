export type KubeconfigStatus = {
  configured: boolean
  updatedAt: Date | null
}

export class KubeconfigRequiredError extends Error {
  readonly code = 'KUBECONFIG_REQUIRED'

  constructor() {
    super('A kubeconfig is required for this operation.')
    this.name = 'KubeconfigRequiredError'
  }
}

export class InvalidKubeconfigError extends Error {
  readonly code = 'INVALID_KUBECONFIG'

  constructor(message: string) {
    super(message)
    this.name = 'InvalidKubeconfigError'
  }
}

export class KubeconfigValidationError extends Error {
  readonly code = 'KUBECONFIG_VALIDATION_FAILED'

  constructor(message = 'Could not authenticate with this kubeconfig.') {
    super(message)
    this.name = 'KubeconfigValidationError'
  }
}
