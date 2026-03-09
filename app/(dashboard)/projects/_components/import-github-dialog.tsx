'use client'

import { useCallback, useEffect, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { MdRefresh } from 'react-icons/md'
import type { ProjectImportStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getInstallationRepos,
  getInstallations,
  type GitHubRepo,
} from '@/lib/actions/github'
import { importProjectFromGitHub } from '@/lib/actions/project'
import { env } from '@/lib/env'
import { GET } from '@/lib/fetch-client'

type Step = 'check-github-app' | 'select-repo'

interface ImportGitHubDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportGitHubDialog({ open, onOpenChange }: ImportGitHubDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('check-github-app')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Step 1 state
  const [hasInstallation, setHasInstallation] = useState(false)
  const [installationId, setInstallationId] = useState<number | null>(null)

  // Step 2 state
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [importProjectId, setImportProjectId] = useState<string | null>(null)

  const resetState = useCallback(() => {
    setStep('check-github-app')
    setIsLoading(true)
    setSearchQuery('')
    setHasInstallation(false)
    setInstallationId(null)
    setRepos([])
    setSelectedRepo(null)
    setIsCreating(false)
    setImportProjectId(null)
  }, [])

  const checkIdentity = useCallback(async () => {
    setIsLoading(true)
    try {
      // Directly check for GitHub App installation
      const installResult = await getInstallations()
      if (installResult.success && installResult.data.length > 0) {
        const firstInstallationId = installResult.data[0].installationId
        setHasInstallation(true)
        setInstallationId(firstInstallationId)
        const repoResult = await getInstallationRepos(firstInstallationId.toString())
        if (repoResult.success) {
          setRepos(repoResult.data)
          setStep('select-repo')
        }
      } else {
        setHasInstallation(false)
        setStep('check-github-app')
      }
    } catch (error) {
      console.error('Failed to check GitHub installation:', error)
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

  useEffect(() => {
    if (!open || !importProjectId) {
      return
    }

    const pollImportStatus = async () => {
      try {
        const project = await GET<{ importStatus: ProjectImportStatus }>(
          `/api/projects/${importProjectId}`
        )

        if (project.importStatus === 'READY') {
          toast.success('Repository imported successfully')
          onOpenChange(false)
          setImportProjectId(null)
          router.refresh()
          return
        }

        if (project.importStatus === 'FAILED') {
          toast.error('Repository import failed. An empty project was created instead.')
          onOpenChange(false)
          setImportProjectId(null)
          router.refresh()
        }
      } catch (error) {
        console.error('Failed to poll import status:', error)
      }
    }

    const timer = setInterval(pollImportStatus, 3000)
    void pollImportStatus()
    return () => clearInterval(timer)
  }, [importProjectId, onOpenChange, open, router])

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
    if (!selectedRepo || !installationId) return

    setIsCreating(true)
    try {
      const result = await importProjectFromGitHub({
        installationId,
        repoId: selectedRepo.id,
        repoName: selectedRepo.name,
        repoFullName: selectedRepo.full_name,
        defaultBranch: selectedRepo.default_branch,
      })

      if (result.success) {
        toast.success(`Project "${selectedRepo.name}" is being imported...`)
        setImportProjectId(result.data.id)
      } else {
        toast.error(result.error || 'Failed to import project')
      }
    } catch (error) {
      console.error('Failed to import project:', error)
      toast.error('Failed to import project')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderStepContent = () => {
    if (isLoading && step === 'check-github-app' && !hasInstallation) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MdRefresh className="w-4 h-4 animate-spin" />
            <span>Checking GitHub App installation...</span>
          </div>
        </div>
      )
    }

    switch (step) {
      case 'check-github-app':
        if (hasInstallation) {
          return null
        }

        return (
          <div className="space-y-4 w-full">
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
          <div className="space-y-4 w-full min-w-0">
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input border-border"
            />

            <ScrollArea className="h-[300px] w-full">
              <div className="pr-4">
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
                  <div className="space-y-2">
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {repo.full_name}
                        </span>
                        {repo.private && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded shrink-0 whitespace-nowrap">
                            Private
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              </div>
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
                      Importing...
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
      <DialogContent className="bg-card border-border text-foreground max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">{getStepTitle()}</DialogTitle>
        </DialogHeader>

        <div className="py-4 w-full min-w-0">{renderStepContent()}</div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
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
