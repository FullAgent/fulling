import { Cron } from 'croner'

import { logger as baseLogger } from '@/lib/logger'
import {
  acquireAndLockImportProjects,
  getImportProjectById,
  type ImportProjectWithRelations,
  LOCK_DURATION_SECONDS,
  setProjectImportState,
  tryClaimImportExecutionLock,
} from '@/lib/repo/project-import'
import { getInstallationToken } from '@/lib/services/github-app'
import { getSandboxTtydContext } from '@/lib/util/ttyd-context'
import { execCommand } from '@/lib/util/ttyd-exec'

const logger = baseLogger.child({ module: 'lib/jobs/project-import/projectImportReconcile' })

const MAX_IMPORTS_PER_CYCLE = parseInt(process.env.MAX_PROJECT_IMPORTS_PER_RECONCILE || '5', 10)
const RECONCILE_INTERVAL_SECONDS = parseInt(
  process.env.PROJECT_IMPORT_RECONCILE_INTERVAL_SECONDS || '10',
  10
)
const CLONING_LOCK_DURATION_SECONDS = 300
const CLONE_MAX_ATTEMPTS = parseInt(process.env.PROJECT_IMPORT_CLONE_MAX_ATTEMPTS || '3', 10)
const IMPORT_EXEC_TIMEOUT_MS = parseInt(process.env.PROJECT_IMPORT_EXEC_TIMEOUT_MS || '90000', 10)

type ImportTriggerSource = 'reconcile' | 'sandbox-running-event'

export function startProjectImportReconcileJob() {
  logger.info('Starting project import reconcile job')
  logger.info(`Lock duration: ${LOCK_DURATION_SECONDS} seconds`)
  logger.info(`Max projects per cycle: ${MAX_IMPORTS_PER_CYCLE}`)
  logger.info(`Reconcile interval: ${RECONCILE_INTERVAL_SECONDS} seconds`)

  const job = new Cron(`*/${RECONCILE_INTERVAL_SECONDS} * * * * *`, async () => {
    try {
      await reconcileProjectImports()
    } catch (error) {
      logger.error(`Project import reconcile job error: ${error}`)
    }
  })

  logger.info(
    `✅ Project import reconcile job started (every ${RECONCILE_INTERVAL_SECONDS} seconds)`
  )
  return job
}

async function reconcileProjectImports() {
  const projects = await acquireAndLockImportProjects(MAX_IMPORTS_PER_CYCLE)

  if (projects.length === 0) {
    return
  }

  logger.info(`Acquired ${projects.length} projects for import reconcile`)

  for (const project of projects) {
    try {
      await handleSingleProjectImport(project, 'reconcile')
    } catch (error) {
      logger.error(`Failed to process project import for ${project.id}: ${error}`)
      await setProjectImportState(project.id, {
        importStatus: 'FAILED',
        importError: String(error),
        importLockedUntil: null,
      })
    }
  }
}

export async function triggerProjectImportForProject(projectId: string): Promise<void> {
  const project = await getImportProjectById(projectId)
  if (!project) {
    return
  }

  if (project.importStatus !== 'PENDING' && project.importStatus !== 'CLONING') {
    return
  }

  const sandbox = project.sandboxes[0]
  if (!sandbox || sandbox.status !== 'RUNNING') {
    return
  }

  const claimed = await tryClaimImportExecutionLock(project.id, CLONING_LOCK_DURATION_SECONDS)
  if (!claimed) {
    return
  }

  const projectAfterLock = await getImportProjectById(project.id)
  if (!projectAfterLock) {
    return
  }

  await handleSingleProjectImport(projectAfterLock, 'sandbox-running-event')
}

async function handleSingleProjectImport(
  project: ImportProjectWithRelations,
  source: ImportTriggerSource
): Promise<void> {
  if (!project.githubRepoFullName || !project.githubAppInstallation || !project.githubRepoDefaultBranch) {
    await setProjectImportState(project.id, {
      importStatus: 'FAILED',
      importError: 'Missing repository metadata for import',
      importLockedUntil: null,
    })
    return
  }

  const sandbox = project.sandboxes[0]
  if (!sandbox) {
    await setProjectImportState(project.id, {
      importStatus: 'FAILED',
      importError: 'Sandbox not found',
      importLockedUntil: null,
    })
    return
  }

  if (sandbox.status !== 'RUNNING') {
    if (project.importStatus === 'CLONING') {
      await setProjectImportState(project.id, {
        importStatus: 'PENDING',
        importLockedUntil: null,
      })
    }
    return
  }

  if (source === 'reconcile') {
    await setProjectImportState(project.id, {
      importStatus: 'CLONING',
      importError: null,
      importLockedUntil: new Date(Date.now() + CLONING_LOCK_DURATION_SECONDS * 1000),
    })
  }

  const cloneResult = await cloneRepoToSandboxWithRetry(project, sandbox.id)
  if (cloneResult.success) {
    await setProjectImportState(project.id, {
      importStatus: 'READY',
      importError: null,
      importLockedUntil: null,
    })
    return
  }

  await setProjectImportState(project.id, {
    importStatus: 'FAILED',
    importError: cloneResult.error,
    importLockedUntil: null,
  })
}

async function cloneRepoToSandboxWithRetry(
  project: ImportProjectWithRelations,
  sandboxId: string
): Promise<{ success: true } | { success: false; error: string }> {
  let lastError = 'Unknown clone error'

  for (let attempt = 1; attempt <= CLONE_MAX_ATTEMPTS; attempt++) {
    const attemptStart = Date.now()
    try {
      logger.info(`Import clone attempt ${attempt}/${CLONE_MAX_ATTEMPTS} for project ${project.id}`)
      await cloneRepoToSandbox(project, sandboxId)
      logger.info(
        `Import clone succeeded on attempt ${attempt} for project ${project.id} in ${Date.now() - attemptStart}ms`
      )
      return { success: true }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      logger.warn(
        `Import clone attempt ${attempt}/${CLONE_MAX_ATTEMPTS} failed for project ${project.id} after ${Date.now() - attemptStart}ms: ${lastError}`
      )
      if (attempt < CLONE_MAX_ATTEMPTS) {
        await sleep(1500)
      }
    }
  }

  return {
    success: false,
    error: `Clone failed after ${CLONE_MAX_ATTEMPTS} attempts: ${lastError}`,
  }
}

async function cloneRepoToSandbox(project: ImportProjectWithRelations, sandboxId: string): Promise<void> {
  const installationToken = await getInstallationToken(project.githubAppInstallation!.installationId)
  const { ttyd } = await getSandboxTtydContext(sandboxId, project.user.id)

  const authUrl = `https://x-access-token:${installationToken}@github.com/${project.githubRepoFullName}.git`
  const escapedAuthUrl = shellEscapeSingleQuoted(authUrl)
  const escapedBranch = shellEscapeSingleQuoted(project.githubRepoDefaultBranch!)
  const repoFullName = project.githubRepoFullName!
  const repoName = repoFullName.split('/').at(-1) || 'repo'
  const importDirName = repoName.replace(/[^a-zA-Z0-9._-]/g, '-')
  const uniqueImportDirName = `${importDirName}-${project.id}`
  const escapedImportDirName = shellEscapeSingleQuoted(uniqueImportDirName)

  const cloneCommand = [
    'set -e',
    'mkdir -p import',
    `target_dir='import/${escapedImportDirName}'`,
    'tmp_dir=$(mktemp -d)',
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
}

function shellEscapeSingleQuoted(input: string): string {
  return input.replace(/'/g, `'\\''`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
