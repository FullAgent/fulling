import type { Database, Project, Sandbox } from '@prisma/client'

/**
 * Type guard utilities for project resources
 */

/**
 * Project with at least one database
 */
export type ProjectWithDatabase = Project & {
  databases: [Database, ...Database[]]
}

/**
 * Check if a project has at least one database
 */
export function hasDatabase(
  project: Project & { databases: Database[] }
): project is ProjectWithDatabase {
  return project.databases.length > 0
}

/**
 * Project with at least one sandbox
 */
export type ProjectWithSandbox = Project & {
  sandboxes: [Sandbox, ...Sandbox[]]
}

/**
 * Check if a project has at least one sandbox
 */
export function hasSandbox(
  project: Project & { sandboxes: Sandbox[] }
): project is ProjectWithSandbox {
  return project.sandboxes.length > 0
}
