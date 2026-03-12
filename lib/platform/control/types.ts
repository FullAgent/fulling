/**
 * Shared result type for control-plane use cases.
 */
export type CommandResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
