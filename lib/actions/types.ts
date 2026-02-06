/**
 * Type definitions for Server Actions
 */

// =============================================================================
// Sandbox Actions
// =============================================================================

/**
 * Generic action result type for all Server Actions
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type ExecResult = {
  success: boolean
  output?: string
  error?: string
}
