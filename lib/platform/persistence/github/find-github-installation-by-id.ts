import { prisma } from '@/lib/db'

/**
 * Loads a persisted GitHub App installation record by GitHub installation ID.
 *
 * Expected inputs:
 * - A GitHub installation ID already known to the control plane.
 *
 * Expected outputs:
 * - Returns the persisted installation record with its owning user, or null.
 *
 * Out of scope:
 * - Does not call GitHub APIs.
 * - Does not validate whether a specific repository is accessible.
 */
export async function findGitHubInstallationById(installationId: number) {
  return prisma.gitHubAppInstallation.findUnique({
    where: { installationId },
    include: { user: true },
  })
}
