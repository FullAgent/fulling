import { Cron } from 'croner'

import { logger as baseLogger } from '@/lib/logger'
import {
  acquireAndLockProjectTasks,
  getProjectTaskById,
  getRunnableTasksForProject,
  incrementProjectTaskAttemptCount,
  LOCK_DURATION_SECONDS,
  type ProjectTaskWithRelations,
  setProjectTaskState,
  tryClaimProjectTaskExecutionLock,
} from '@/lib/repo/project-task'

import { runProjectTaskExecutor } from './executors'

const logger = baseLogger.child({ module: 'lib/jobs/project-task/projectTaskReconcile' })

const MAX_TASKS_PER_CYCLE = parseInt(process.env.MAX_PROJECT_TASKS_PER_RECONCILE || '10', 10)
const RECONCILE_INTERVAL_SECONDS = parseInt(
  process.env.PROJECT_TASK_RECONCILE_INTERVAL_SECONDS || '13',
  10
)
const EXECUTION_LOCK_DURATION_SECONDS = parseInt(
  process.env.PROJECT_TASK_EXECUTION_LOCK_DURATION_SECONDS || '300',
  10
)

export function startProjectTaskReconcileJob() {
  logger.info('Starting project task reconcile job')
  logger.info(`Lock duration: ${LOCK_DURATION_SECONDS} seconds`)
  logger.info(`Execution lock duration: ${EXECUTION_LOCK_DURATION_SECONDS} seconds`)
  logger.info(`Max tasks per cycle: ${MAX_TASKS_PER_CYCLE}`)
  logger.info(`Reconcile interval: ${RECONCILE_INTERVAL_SECONDS} seconds`)

  const job = new Cron(`*/${RECONCILE_INTERVAL_SECONDS} * * * * *`, async () => {
    try {
      await reconcileProjectTasks()
    } catch (error) {
      logger.error(`Project task reconcile job error: ${error}`)
    }
  })

  logger.info(`✅ Project task reconcile job started (every ${RECONCILE_INTERVAL_SECONDS} seconds)`)
  return job
}

async function reconcileProjectTasks() {
  const tasks = await acquireAndLockProjectTasks(MAX_TASKS_PER_CYCLE)

  if (tasks.length === 0) {
    return
  }

  logger.info(`Acquired ${tasks.length} project tasks for reconcile`)

  for (const task of tasks) {
    try {
      await handleProjectTask(task)
    } catch (error) {
      logger.error(`Failed to process project task ${task.id}: ${error}`)
    }
  }
}

export async function triggerRunnableTasksForProject(projectId: string): Promise<void> {
  const tasks = await getRunnableTasksForProject(projectId)
  for (const task of tasks) {
    try {
      const freshTask = await getProjectTaskById(task.id)
      if (freshTask) {
        await handleProjectTask(freshTask)
      }
    } catch (error) {
      logger.error(`Failed to trigger project task ${task.id}: ${error}`)
    }
  }
}

async function handleProjectTask(task: ProjectTaskWithRelations): Promise<void> {
  const prerequisites = evaluateTaskPrerequisites(task)
  if (!prerequisites.ready) {
    await setProjectTaskState(task.id, {
      status: 'WAITING_FOR_PREREQUISITES',
      error: prerequisites.reason ?? null,
      lockedUntil: null,
      startedAt: null,
      finishedAt: null,
    })
    return
  }

  const claimed = await tryClaimProjectTaskExecutionLock(task.id, EXECUTION_LOCK_DURATION_SECONDS)
  if (!claimed) {
    return
  }

  const executingTask = await getProjectTaskById(task.id)
  if (!executingTask) {
    return
  }

  const attemptCount = await incrementProjectTaskAttemptCount(task.id)
  const result = await runProjectTaskExecutor(executingTask)

  if (result.success) {
    await setProjectTaskState(task.id, {
      status: 'SUCCEEDED',
      error: null,
      result: result.result,
      lockedUntil: null,
      finishedAt: new Date(),
      attemptCount,
    })
    return
  }

  if (result.retryable && attemptCount < executingTask.maxAttempts) {
    await setProjectTaskState(task.id, {
      status: 'PENDING',
      error: result.error,
      lockedUntil: null,
      finishedAt: null,
      attemptCount,
    })
    return
  }

  await setProjectTaskState(task.id, {
    status: 'FAILED',
    error: result.error,
    lockedUntil: null,
    finishedAt: new Date(),
    attemptCount,
  })
}

function evaluateTaskPrerequisites(
  task: Pick<ProjectTaskWithRelations, 'type' | 'sandbox'>
): { ready: boolean; reason?: string } {
  switch (task.type) {
    case 'CLONE_REPOSITORY':
    case 'INSTALL_SKILL':
    case 'UNINSTALL_SKILL':
    case 'DEPLOY_PROJECT':
      if (!task.sandbox) {
        return { ready: false, reason: 'Sandbox not found' }
      }
      if (task.sandbox.status !== 'RUNNING') {
        return {
          ready: false,
          reason: `Waiting for sandbox to become RUNNING (current: ${task.sandbox.status})`,
        }
      }
      return { ready: true }
    default:
      return { ready: false, reason: `Unknown task type ${task.type}` }
  }
}
