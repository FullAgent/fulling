'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserGitHubToken } from '@/lib/services/github-token-refresh'
import { execCommand, TtydExecError } from '@/lib/util/ttyd-exec'

export type RepoInitResult = {
  success: boolean
  message: string
  code?: string
}

/**
 * Helper to get project TTYD context and verify ownership.
 * This ensures the project belongs to the requesting user before proceeding.
 */
async function getTtydContext(projectId: string, userId: string) {
  // security measure
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: userId,
    },
    include: {
      sandboxes: true,
      environments: true,
    },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  const sandbox = project.sandboxes[0]
  if (!sandbox) {
    throw new Error('Sandbox not found')
  }

  const ttydAccessToken = project.environments.find(
    (env) => env.key === 'TTYD_ACCESS_TOKEN'
  )?.value

  if (!sandbox.ttydUrl || !ttydAccessToken) {
    throw new Error('Sandbox configuration missing')
  }

  // Parse the ttydUrl to get base URL (without query params)
  const ttydBaseUrl = new URL(sandbox.ttydUrl)
  
  // Extract authorization param if present
  const authorization = ttydBaseUrl.searchParams.get('authorization') || undefined
  
  ttydBaseUrl.search = '' // Remove query params
  const baseUrl = ttydBaseUrl.toString().replace(/\/$/, '')

  return { baseUrl, accessToken: ttydAccessToken, authorization, project }
}


/**
 * Initialize a git repository in the project's sandbox
 * @param projectId - The ID of the project
 */
export async function initializeRepo(projectId: string): Promise<RepoInitResult> {
  const session = await auth()

  if (!session) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const { baseUrl, accessToken, authorization, project } = await getTtydContext(projectId, session.user.id)

    // Create GitHub repo first
    const repoResult = await createGithubRepo(project.name)
    if (!repoResult.success) {
      return { success: false, message: repoResult.message, code: repoResult.code }
    }

    // Save repo info to database (both new fields and legacy field for backward compatibility)
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        githubRepo: repoResult.repoUrl,
        githubRepoFullName: repoResult.repoFullName,
        githubRepoId: repoResult.repoId,
      },
    })

    await runInitCommand(baseUrl, accessToken, authorization)

    // Push the initial code to GitHub
    const pushResult = await pushToGithub(projectId)
    if (!pushResult.success) {
      return { success: true, message: `Initialized locally but failed to push: ${pushResult.message}` }
    }

    return { success: true, message: 'Repository initialized and pushed successfully' }
  } catch (error) {
    console.error('Failed to initialize repo:', error)
    const errorMessage = error instanceof TtydExecError ? error.message : 'Unknown error'
    return { success: false, message: `Failed to initialize: ${errorMessage}` }
  }
}

async function runInitCommand(baseUrl: string, accessToken: string, authorization?: string) {
  return execCommand(
    baseUrl,
    accessToken,
    'git init -b main && git add . && claude -p "commit all staged changes with a descriptive message" --dangerously-skip-permissions',
    300000,
    authorization
  )

}

export type CreateRepoResult = {
  success: boolean
  message: string
  repoUrl?: string
  cloneUrl?: string
  repoId?: number
  repoFullName?: string
  code?: string
}

/**
 * Create a new GitHub repository for the user
 * @param repoName - The name of the new repository
 */
export async function createGithubRepo(repoName: string): Promise<CreateRepoResult> {
  const session = await auth()

  if (!session) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const token = await getUserGitHubToken(session.user.id)

    if (!token) {
      return { success: false, message: 'GitHub identity not found. Please link your GitHub account.', code: 'GITHUB_NOT_BOUND' }
    }

    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        name: repoName,
        private: true,
        description: 'Created by Fulling, Powered by Sealos',
        auto_init: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { 
        success: false, 
        message: `GitHub API Error: ${errorData.message || response.statusText}` 
      }
    }

    const repoData = await response.json()
    
    return {
      success: true,
      message: 'Repository created successfully',
      repoUrl: repoData.html_url,
      cloneUrl: repoData.clone_url,
      repoId: repoData.id,
      repoFullName: repoData.full_name,
    }
  } catch (error) {
    console.error('Failed to create GitHub repo:', error)
    return { success: false, message: `Failed to create repository: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/**
 * Commit all changes in the project's sandbox
 * @param projectId - The ID of the project
 */
export async function commitChanges(projectId: string): Promise<RepoInitResult> {
  const session = await auth()

  if (!session) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const { baseUrl, accessToken, authorization } = await getTtydContext(projectId, session.user.id)
    
    await execCommand(
      baseUrl,
      accessToken,
      'git add . && claude -p "commit all staged changes with a descriptive message" --dangerously-skip-permissions',
      undefined,
      authorization
    )

    // Push changes to GitHub
    const pushResult = await pushToGithub(projectId)
    if (!pushResult.success) {
      // If authentication failed, we should return failure so the UI can prompt for binding
      if (pushResult.code === 'GITHUB_NOT_BOUND') {
        return { success: false, message: pushResult.message, code: pushResult.code }
      }
      return { success: true, message: `Committed locally but failed to push: ${pushResult.message}` }
    }

    return { success: true, message: 'Changes committed and pushed successfully' }
  } catch (error) {
    console.error('Failed to commit changes:', error)
    const errorMessage = error instanceof TtydExecError ? error.message : 'Unknown error'
    return { success: false, message: `Failed to commit: ${errorMessage}` }
  }
}

/**
 * Push local commits to GitHub
 * @param projectId - The ID of the project
 */
export async function pushToGithub(projectId: string): Promise<RepoInitResult> {
  const session = await auth()

  if (!session) {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const { baseUrl, accessToken, authorization, project } = await getTtydContext(projectId, session.user.id)

    const repoFullName = project.githubRepoFullName || project.githubRepo
    if (!repoFullName) {
      return { success: false, message: 'No GitHub repository linked to this project' }
    }

    const githubToken = await getUserGitHubToken(session.user.id)

    if (!githubToken) {
      return { success: false, message: 'GitHub token not found', code: 'GITHUB_NOT_BOUND' }
    }

    const authUrl = `https://oauth2:${githubToken}@github.com/${repoFullName}.git`

    const command = `
      (git remote get-url origin > /dev/null 2>&1 && git remote set-url origin '${authUrl}') || git remote add origin '${authUrl}' &&
      git branch -M main &&
      git push -u origin main
    `.replace(/\n/g, ' ').trim()

    await execCommand(baseUrl, accessToken, command, 300000, authorization)

    return { success: true, message: 'Code pushed to GitHub successfully' }
  } catch (error) {
    console.error('Failed to push to GitHub:', error)
    const errorMessage = error instanceof TtydExecError ? error.message : 'Unknown error'
    return { success: false, message: `Failed to push: ${errorMessage}` }
  }
}
