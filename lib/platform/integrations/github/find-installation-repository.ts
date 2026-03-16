import { listInstallationRepos } from '@/lib/services/github-app'

/**
 * Finds a repository within a GitHub App installation by stable repo identity.
 *
 * Expected inputs:
 * - A valid GitHub App installation ID that Fulling can access.
 * - The repository ID and full name selected by the user.
 *
 * Expected outputs:
 * - Returns the matching installation repository when accessible, otherwise null.
 *
 * Out of scope:
 * - Does not verify Fulling user ownership of the installation record.
 * - Does not persist any control-plane state.
 */
export async function findInstallationRepository(input: {
  installationId: number
  repoId: number
  repoFullName: string
}) {
  const repos = await listInstallationRepos(input.installationId)

  return (
    repos.find((repo) => repo.id === input.repoId && repo.full_name === input.repoFullName) ?? null
  )
}
