import type { Project } from '@prisma/client'

import { EnvironmentCategory } from '@/lib/const'
import { prisma } from '@/lib/db'
import { KubernetesUtils } from '@/lib/k8s/kubernetes-utils'
import { VERSIONS } from '@/lib/k8s/versions'
import { logger as baseLogger } from '@/lib/logger'
import { CommandResult } from '@/lib/platform/control/types'
import { createInstallSkillTask } from '@/lib/platform/persistence/project-task/create-install-skill-task'
import { generateRandomString } from '@/lib/util/common'

const logger = baseLogger.child({ module: 'platform/persistence/project/create-project-with-sandbox' })

export type CreateProjectWithSandboxInput = {
  userId: string
  namespace: string
  name: string
  description?: string
  githubSource?: {
    githubAppInstallationId: string
    githubRepoId: number
    githubRepoFullName: string
    githubRepoDefaultBranch?: string
  }
  initialInstallSkills?: Array<{
    userSkillId: string
    skillId: string
    installCommand: string
  }>
}

export type CreateProjectWithSandboxData = {
  project: Project
  sandbox: {
    id: string
  }
}

/**
 * Persists the initial project, sandbox, and workspace credentials for a new project.
 *
 * Expected inputs:
 * - A validated project name and a namespace already resolved by the control layer.
 * - Optional GitHub source metadata that belongs to the project record itself.
 *
 * Expected outputs:
 * - Creates the project, its primary sandbox, required environment records, and optional bootstrap tasks in one transaction.
 * - Returns the created project plus sandbox identity for follow-up state creation.
 *
 * Out of scope:
 * - Does not resolve Kubernetes namespaces.
 * - Does not perform any external Kubernetes or GitHub effects.
 */
export async function createProjectWithSandbox({
  userId,
  namespace,
  name,
  description,
  githubSource,
  initialInstallSkills = [],
}: CreateProjectWithSandboxInput): Promise<CommandResult<CreateProjectWithSandboxData>> {
  logger.info(`Creating project: ${name} for user: ${userId}`)

  const k8sProjectName = KubernetesUtils.toK8sProjectName(name)
  const randomSuffix = KubernetesUtils.generateRandomString()
  const ttydAuthToken = generateRandomString(24)
  const fileBrowserUsername = `fb-${randomSuffix}`
  const fileBrowserPassword = generateRandomString(16)
  const sandboxName = `${k8sProjectName}-${randomSuffix}`

  const result = await prisma.$transaction(
    async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description,
          userId,
          status: 'CREATING',
          githubAppInstallationId: githubSource?.githubAppInstallationId,
          githubRepoId: githubSource?.githubRepoId,
          githubRepoFullName: githubSource?.githubRepoFullName,
          githubRepoDefaultBranch: githubSource?.githubRepoDefaultBranch,
        },
      })

      const sandbox = await tx.sandbox.create({
        data: {
          projectId: project.id,
          name: sandboxName,
          k8sNamespace: namespace,
          sandboxName,
          status: 'CREATING',
          lockedUntil: null,
          runtimeImage: VERSIONS.RUNTIME_IMAGE,
          cpuRequest: VERSIONS.RESOURCES.SANDBOX.requests.cpu,
          cpuLimit: VERSIONS.RESOURCES.SANDBOX.limits.cpu,
          memoryRequest: VERSIONS.RESOURCES.SANDBOX.requests.memory,
          memoryLimit: VERSIONS.RESOURCES.SANDBOX.limits.memory,
        },
      })

      await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'TTYD_ACCESS_TOKEN',
          value: ttydAuthToken,
          category: EnvironmentCategory.TTYD,
          isSecret: true,
        },
      })

      await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'FILE_BROWSER_USERNAME',
          value: fileBrowserUsername,
          category: EnvironmentCategory.FILE_BROWSER,
          isSecret: false,
        },
      })

      await tx.environment.create({
        data: {
          projectId: project.id,
          key: 'FILE_BROWSER_PASSWORD',
          value: fileBrowserPassword,
          category: EnvironmentCategory.FILE_BROWSER,
          isSecret: true,
        },
      })

      for (const skill of initialInstallSkills) {
        await createInstallSkillTask(tx, {
          projectId: project.id,
          sandboxId: sandbox.id,
          userSkillId: skill.userSkillId,
          skillId: skill.skillId,
          installCommand: skill.installCommand,
        })
      }

      return {
        project,
        sandbox: {
          id: sandbox.id,
        },
      }
    },
    {
      timeout: 20000,
    }
  )

  logger.info(`Project created: ${result.project.id}`)
  return { success: true, data: result }
}
