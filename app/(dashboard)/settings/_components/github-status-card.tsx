'use client'

import { useEffect, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { MdCheck } from 'react-icons/md'
import Image from 'next/image'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { getInstallations, type GitHubInstallation } from '@/lib/actions/github'
import { env } from '@/lib/env'

export function GitHubStatusCard() {
  const [isLoading, setIsLoading] = useState(true)
  const [installation, setInstallation] = useState<GitHubInstallation | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const installationsResult = await getInstallations()

      if (installationsResult.success && installationsResult.data.length > 0) {
        setInstallation(installationsResult.data[0])
      }
    } catch (error) {
      console.error('Failed to load GitHub data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstallApp = () => {
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
    }

    window.addEventListener('message', handleMessage)
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-card/50 border border-border rounded-lg animate-pulse">
        <div className="h-32 bg-muted/50 rounded" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-card/50 border border-border rounded-lg">
      <div className="flex gap-8">
        <div className="flex-shrink-0">
          <h3 className="text-lg font-medium text-foreground mb-1">GitHub Integration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your GitHub account to Fulling
          </p>
          <div className="w-20 h-20 bg-secondary/50 border border-border rounded-xl flex items-center justify-center">
            {installation ? (
              <div className="relative">
                <FaGithub className="w-10 h-10 text-foreground" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <MdCheck className="w-3 h-3 text-white" />
                </div>
              </div>
            ) : (
              <FaGithub className="w-10 h-10 text-foreground" />
            )}
          </div>
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground mb-2">
            What does the GitHub Integration do?
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Connecting to GitHub allows you to sync your project to fulling, and automatically deploys your production-ready project to Sealos.
          </p>

          {installation ? (
            <div className="flex items-center gap-3">
              {installation.accountAvatarUrl ? (
                <Image
                  src={installation.accountAvatarUrl}
                  alt={installation.accountLogin}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <FaGithub className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground">
                {installation.accountLogin}
              </span>
              <span className="text-xs text-green-600 dark:text-green-500">● Connected</span>
            </div>
          ) : (
            <Button
              onClick={handleInstallApp}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <FaGithub className="mr-2 h-4 w-4" />
              Connect to GitHub
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
