import type { ProjectTaskType } from '@prisma/client'

import type { ProjectTaskWithRelations } from '@/lib/repo/project-task'

import { type ProjectTaskExecutorResult, runCloneRepositoryTask } from './clone-repository'
import { runInstallSkillTask } from './install-skill'
import { runUninstallSkillTask } from './uninstall-skill'

export async function runProjectTaskExecutor(
  task: ProjectTaskWithRelations
): Promise<ProjectTaskExecutorResult> {
  switch (task.type as ProjectTaskType) {
    case 'CLONE_REPOSITORY':
      return runCloneRepositoryTask(task)
    case 'INSTALL_SKILL':
      return runInstallSkillTask(task)
    case 'UNINSTALL_SKILL':
      return runUninstallSkillTask(task)
    default:
      return {
        success: false,
        error: `No executor registered for task type ${task.type}`,
        retryable: false,
      }
  }
}

export type { ProjectTaskExecutorResult }
