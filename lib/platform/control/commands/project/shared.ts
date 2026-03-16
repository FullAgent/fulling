/**
 * Validates the project display name before the control layer persists any state.
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty' }
  }

  const allowedPattern = /^[a-zA-Z0-9\s-]+$/
  if (!allowedPattern.test(name)) {
    return {
      valid: false,
      error: 'Project name can only contain letters, numbers, spaces, and hyphens',
    }
  }

  const trimmedName = name.trim()
  if (!/^[a-zA-Z]/.test(trimmedName)) {
    return { valid: false, error: 'Project name must start with a letter' }
  }

  if (!/[a-zA-Z]$/.test(trimmedName)) {
    return { valid: false, error: 'Project name must end with a letter' }
  }

  return { valid: true }
}
