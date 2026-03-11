import type { Prisma } from '@prisma/client'

import type { ProjectTaskWithRelations } from '@/lib/repo/project-task'
import { getInstallationToken } from '@/lib/services/github-app'
import { getSandboxTtydContext } from '@/lib/util/ttyd-context'
import { execCommand } from '@/lib/util/ttyd-exec'

export type ProjectTaskExecutorResult =
  | { success: true; result?: Prisma.InputJsonValue }
  | { success: false; error: string; retryable: boolean }

const IMPORT_EXEC_TIMEOUT_MS = parseInt(process.env.PROJECT_IMPORT_EXEC_TIMEOUT_MS || '90000', 10)

type CloneRepositoryPayload = {
  installationId?: number
  repoFullName?: string
  defaultBranch?: string
}

export async function runCloneRepositoryTask(
  task: ProjectTaskWithRelations
): Promise<ProjectTaskExecutorResult> {
  const payload = (task.payload ?? {}) as CloneRepositoryPayload
  const installationId = payload.installationId
  const repoFullName = payload.repoFullName
  const defaultBranch = payload.defaultBranch

  if (!installationId || !repoFullName || !defaultBranch) {
    return {
      success: false,
      error: 'Missing clone repository payload',
      retryable: false,
    }
  }

  if (!task.sandbox?.id) {
    return {
      success: false,
      error: 'Sandbox not found for clone task',
      retryable: false,
    }
  }

  try {
    const installationToken = await getInstallationToken(installationId)
    const { ttyd } = await getSandboxTtydContext(task.sandbox.id, task.project.user.id)

    const authUrl = `https://x-access-token:${installationToken}@github.com/${repoFullName}.git`
    const escapedAuthUrl = shellEscapeSingleQuoted(authUrl)
    const escapedBranch = shellEscapeSingleQuoted(defaultBranch)
    const repoName = repoFullName.split('/').at(-1) || 'repo'
    const importDirName = repoName.replace(/[^a-zA-Z0-9._-]/g, '-')
    const uniqueImportDirName = `${importDirName}-${task.projectId}`
    const escapedImportDirName = shellEscapeSingleQuoted(uniqueImportDirName)

    const cloneCommand = [
      'set -e',
      'mkdir -p import',
      `target_dir='import/${escapedImportDirName}'`,
      'tmp_dir=$(mktemp -d)',
      `rm -rf "$target_dir"`,
      `GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=/bin/echo git clone --depth 1 --branch '${escapedBranch}' '${escapedAuthUrl}' "$tmp_dir/repo"`,
      'mkdir -p "$target_dir"',
      'cp -a "$tmp_dir/repo"/. "$target_dir"/',
      'rm -rf "$tmp_dir"',
    ].join(' && ')

    await execCommand(
      ttyd.baseUrl,
      ttyd.accessToken,
      cloneCommand,
      IMPORT_EXEC_TIMEOUT_MS,
      ttyd.authorization
    )

    return {
      success: true,
      result: {
        repoFullName,
        defaultBranch,
        importPath: `import/${uniqueImportDirName}`,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      retryable: true,
    }
  }
}

function shellEscapeSingleQuoted(input: string): string {
  return input.replace(/'/g, `'\\''`)
}
