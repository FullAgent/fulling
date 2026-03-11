'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { getInstallations } from '@/lib/actions/github'
import type { ProjectWithRelations } from '@/lib/data/project'
import { env } from '@/lib/env'
import type { ProjectDisplayStatus } from '@/lib/util/project-display-status'

import { PageHeaderWithFilter } from './page-header-with-filter'
import { ProjectList } from './project-list'

const REFRESH_INTERVAL_MS = 3000

interface HomePageContentProps {
  projects: ProjectWithRelations<{ sandboxes: true }>[]
}

export function HomePageContent({ projects }: HomePageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeFilter, setActiveFilter] = useState<'ALL' | ProjectDisplayStatus>('ALL')
  const [hasTriggeredInstall, setHasTriggeredInstall] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    if (hasTriggeredInstall) return

    const shouldTriggerInstall = searchParams.get('github_install') === 'true'
    if (!shouldTriggerInstall) return

    const triggerGitHubAppInstall = async () => {
      setHasTriggeredInstall(true)

      try {
        const result = await getInstallations()
        if (result.success && result.data.length > 0) {
          router.replace('/projects')
          return
        }

        const appName = env.NEXT_PUBLIC_GITHUB_APP_NAME
        if (!appName) {
          toast.error('GitHub App is not configured')
          router.replace('/projects')
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
          router.replace('/projects')
          return
        }

        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          if (event.data.type !== 'github-app-installed') return

          window.removeEventListener('message', handleMessage)
          toast.success('GitHub App installed successfully!')
          router.replace('/projects')
          router.refresh()
        }

        window.addEventListener('message', handleMessage)

        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            router.replace('/projects')
          }
        }, 500)
      } catch (error) {
        console.error('Failed to trigger GitHub App install:', error)
        router.replace('/projects')
      }
    }

    triggerGitHubAppInstall()
  }, [searchParams, hasTriggeredInstall, router])

  return (
    <>
      <PageHeaderWithFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <ProjectList projects={projects} activeFilter={activeFilter} />
    </>
  )
}
