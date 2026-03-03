'use client'

import { useCallback, useEffect, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { MdCheck, MdRefresh } from 'react-icons/md'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  checkGitHubIdentity,
  getInstallationRepos,
  getInstallations,
  type GitHubRepo,
} from '@/lib/actions/github'
import { createProject } from '@/lib/actions/project'
import { env } from '@/lib/env'

type Step = 'check-github-identity' | 'check-github-app' | 'select-repo'

interface ImportGitHubDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportGitHubDialog({ open, onOpenChange }: ImportGitHubDialogProps) {
  const [step, setStep] = useState<Step>('check-github-identity')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Step 1 state
  const [githubIdentity, setGithubIdentity] = useState<{
    linked: boolean
    githubId?: string
    githubLogin?: string
  } | null>(null)

  // Step 2 state
  const [hasInstallation, setHasInstallation] = useState(false)

  // Step 3 state
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const resetState = useCallback(() => {
    setStep('check-github-identity')
    setIsLoading(false)
    setSearchQuery('')
    setGithubIdentity(null)
    setHasInstallation(false)
    setRepos([])
    setSelectedRepo(null)
    setIsCreating(false)
  }, [])

  const checkIdentity = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await checkGitHubIdentity()
      if (result.success) {
        setGithubIdentity(result.data)
        if (result.data.linked) {
          const installResult = await getInstallations()
          if (installResult.success && installResult.data.length > 0) {
            setHasInstallation(true)
            const repoResult = await getInstallationRepos(installResult.data[0].installationId.toString())
            if (repoResult.success) {
              setRepos(repoResult.data)
              setStep('select-repo')
            }
          } else {
            setHasInstallation(false)
            setStep('check-github-app')
          }
        }
      }
    } catch (error) {
      console.error('Failed to check GitHub identity:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      resetState()
      checkIdentity()
    }
  }, [open, resetState, checkIdentity])

  const handleConnectGitHub = () => {
    setIsLoading(true)

    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      '/api/user/github/bind',
      'github-oauth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )

    if (!popup) {
      toast.error('Failed to open popup window. Please allow popups for this site.')
      setIsLoading(false)
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data.type !== 'github-oauth-callback') return

      if (event.data.success) {
        toast.success('GitHub account connected successfully!')
        checkIdentity()
      } else {
        toast.error(event.data.message || 'Failed to connect GitHub account')
      }

      setIsLoading(false)
      window.removeEventListener('message', handleMessage)
    }

    window.addEventListener('message', handleMessage)

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        setIsLoading(false)
        window.removeEventListener('message', handleMessage)
      }
    }, 500)
  }

  const handleInstallApp = () => {
    const appName = env.NEXT_PUBLIC_GITHUB_APP_NAME
    if (!appName) {
      toast.error('GitHub App is not configured')
      return
    }

    setIsLoading(true)

    const installUrl = `https://github.com/apps/${appName}/installations/new`

    const width = 800
    const height = 800
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      installUrl,
      'github-app-install',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )

    if (!popup) {
      toast.error('Failed to open popup window. Please allow popups for this site.')
      setIsLoading(false)
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data.type !== 'github-app-installed') return

      window.removeEventListener('message', handleMessage)
      clearInterval(checkClosed)
      toast.success('GitHub App installed successfully!')
      checkIdentity()
    }

    window.addEventListener('message', handleMessage)

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        checkIdentity()
      }
    }, 500)
  }

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo)
  }

  const handleImport = async () => {
    if (!selectedRepo) return

    setIsCreating(true)
    try {
      const result = await createProject(selectedRepo.name)
      if (result.success) {
        toast.success(`Project "${selectedRepo.name}" created successfully!`)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderStepContent = () => {
    if (isLoading && step === 'check-github-identity' && !githubIdentity) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MdRefresh className="w-4 h-4 animate-spin" />
            <span>Checking GitHub connection...</span>
          </div>
        </div>
      )
    }

    switch (step) {
      case 'check-github-identity':
        if (githubIdentity?.linked) {
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
                  <MdCheck className="w-5 h-5 text-green-600 dark:text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {githubIdentity.githubLogin || 'Connected'}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-500">● Connected</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your GitHub account is connected.
                  </p>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to import repositories.
              </p>
            </div>

            <Button
              onClick={handleConnectGitHub}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <FaGithub className="mr-2 h-4 w-4" />
              {isLoading ? 'Connecting...' : 'Connect GitHub Account'}
            </Button>
          </div>
        )

      case 'check-github-app':
        if (hasInstallation) {
          return null
        }

        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Install the GitHub App to grant access to your repositories.
              </p>
            </div>

            <Button
              onClick={handleInstallApp}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <FaGithub className="mr-2 h-4 w-4" />
              {isLoading ? 'Installing...' : 'Install GitHub App'}
            </Button>
          </div>
        )

      case 'select-repo':
        return (
          <div className="space-y-4">
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input border-border"
            />

            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MdRefresh className="w-4 h-4 animate-spin" />
                    <span>Loading repositories...</span>
                  </div>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No repositories found
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedRepo?.id === repo.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card/50 border-border hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {repo.full_name}
                            </span>
                            {repo.private && (
                              <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded">
                                Private
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        {repo.language && (
                          <span className="text-xs text-muted-foreground ml-2">{repo.language}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedRepo && (
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setSelectedRepo(null)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <MdRefresh className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Import'
                  )}
                </Button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'check-github-identity':
        return 'Connect GitHub'
      case 'check-github-app':
        return 'Install GitHub App'
      case 'select-repo':
        return 'Select Repository'
      default:
        return 'Import from GitHub'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">{getStepTitle()}</DialogTitle>
        </DialogHeader>

        <div className="py-4">{renderStepContent()}</div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
          <div
            className={`w-2 h-2 rounded-full ${
              step === 'check-github-identity' ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full ${
              step === 'check-github-app' ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full ${
              step === 'select-repo' ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
