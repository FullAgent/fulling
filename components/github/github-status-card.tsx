'use client'

import { useEffect, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { MdCheck, MdOpenInNew, MdRefresh } from 'react-icons/md'
import Image from 'next/image'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  checkGitHubIdentity,
  getInstallations,
  type GitHubInstallation,
} from '@/lib/actions/github'
import { env } from '@/lib/env'

interface GitHubStatusCardProps {
  onInstallApp?: () => void
}

export function GitHubStatusCard({ onInstallApp }: GitHubStatusCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [githubIdentity, setGithubIdentity] = useState<{
    linked: boolean
    githubId?: string
    githubLogin?: string
  } | null>(null)
  const [installations, setInstallations] = useState<GitHubInstallation[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [identityResult, installationsResult] = await Promise.all([
        checkGitHubIdentity(),
        getInstallations(),
      ])

      if (identityResult.success) {
        setGithubIdentity(identityResult.data)
      }

      if (installationsResult.success) {
        setInstallations(installationsResult.data)
      }
    } catch (error) {
      console.error('Failed to load GitHub data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectGitHub = () => {
    setIsConnecting(true)

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
      setIsConnecting(false)
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data.type !== 'github-oauth-callback') return

      if (event.data.success) {
        toast.success('GitHub account connected successfully!')
        loadData()
      } else {
        toast.error(event.data.message || 'Failed to connect GitHub account')
      }

      setIsConnecting(false)
      window.removeEventListener('message', handleMessage)
    }

    window.addEventListener('message', handleMessage)

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        setIsConnecting(false)
        window.removeEventListener('message', handleMessage)
      }
    }, 500)
  }

  const handleInstallApp = () => {
    if (!githubIdentity?.linked) {
      toast.error('Please connect your GitHub account first')
      return
    }

    const appName = env.NEXT_PUBLIC_GITHUB_APP_NAME
    if (!appName) {
      toast.error('GitHub App is not configured')
      return
    }

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
      return
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
      }
    }, 500)

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data.type !== 'github-app-installed') return

      window.removeEventListener('message', handleMessage)
      clearInterval(checkClosed)
      toast.success('GitHub App installed successfully!')
      loadData()
      onInstallApp?.()
    }

    window.addEventListener('message', handleMessage)
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-card/50 border border-border rounded-lg">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MdRefresh className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* GitHub Identity Section */}
      <div className="p-6 bg-card/50 border border-border rounded-lg">
        <div className="flex items-start gap-5 mb-6">
          <div className="p-3 bg-secondary/50 rounded-xl border border-border">
            <FaGithub className="w-8 h-8 text-foreground" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-lg font-medium text-foreground">GitHub Account</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect your GitHub account to enable repository access and code management features.
            </p>
          </div>
        </div>

        <div className="pl-[76px]">
          {githubIdentity?.linked ? (
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
                  Your GitHub account is connected and ready to use.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No GitHub account connected. Connect your GitHub account to access repositories
                  and enable version control features.
                </p>
              </div>

              <Button
                onClick={handleConnectGitHub}
                disabled={isConnecting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <FaGithub className="mr-2 h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect GitHub Account'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* GitHub App Installations Section */}
      {githubIdentity?.linked && (
        <div className="p-6 bg-card/50 border border-border rounded-lg">
          <div className="flex items-start gap-5 mb-6">
            <div className="p-3 bg-secondary/50 rounded-xl border border-border">
              <FaGithub className="w-8 h-8 text-foreground" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-lg font-medium text-foreground">GitHub App Installations</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Install the GitHub App to grant access to your repositories.
              </p>
            </div>
          </div>

          <div className="pl-[76px] space-y-4">
            {installations.length > 0 ? (
              <>
                <div className="space-y-3">
                  {installations.map((installation) => (
                    <div
                      key={installation.id}
                      className="flex items-center gap-4 p-4 bg-secondary/30 border border-border/50 rounded-lg"
                    >
                      {installation.accountAvatarUrl ? (
                        <Image
                          src={installation.accountAvatarUrl}
                          alt={installation.accountLogin}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <FaGithub className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {installation.accountLogin}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({installation.accountType})
                          </span>
                          {installation.status === 'ACTIVE' && (
                            <span className="text-xs text-green-600 dark:text-green-500">● Active</span>
                          )}
                          {installation.status === 'SUSPENDED' && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-500">● Suspended</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {installation.repositorySelection === 'all'
                            ? 'All repositories'
                            : 'Selected repositories'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={handleInstallApp}>
                  <MdOpenInNew className="mr-2 h-4 w-4" />
                  Manage Installations
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No GitHub App installations found. Install the app to access your repositories.
                  </p>
                </div>

                <Button onClick={handleInstallApp}>
                  <FaGithub className="mr-2 h-4 w-4" />
                  Install GitHub App
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
