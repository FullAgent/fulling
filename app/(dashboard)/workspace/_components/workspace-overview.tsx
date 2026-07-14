'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, CircleDashed, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import {
  formatUpdatedAt,
  type KubeconfigStatus,
  parseKubeconfigStatus,
} from '../../_components/kubeconfig-status'

type WorkspaceOverviewProps = { user: { name: string; email: string; image: string | null } }

export function WorkspaceOverview({ user }: WorkspaceOverviewProps) {
  const [status, setStatus] = useState<KubeconfigStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/kubeconfig', { method: 'GET', cache: 'no-store' })
      if (!response.ok) throw new Error('request failed')
      setStatus(parseKubeconfigStatus(await response.json()))
    } catch {
      setError('Kubeconfig status could not be loaded.')
    }
  }, [])

  useEffect(() => { void loadStatus() }, [loadStatus])

  return (
    <main className="mx-auto w-full max-w-[var(--page-max-width)] px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[length:var(--text-micro)] font-medium uppercase leading-[var(--leading-micro)] tracking-[0.056em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-2 text-xl font-semibold leading-[var(--leading-heading)]">
            Welcome, {user.name}
          </h1>
        </div>
        <Button asChild>
          <Link href="/settings/kubeconfig">Open settings <ArrowRight /></Link>
        </Button>
      </div>
      <div className="grid gap-10 py-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <section aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-lg font-semibold leading-[var(--leading-heading-sm)]">Account</h2>
          <div className="mt-5 flex items-center gap-4">
            <Avatar className="size-12"><AvatarImage src={user.image ?? undefined} alt="" /><AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0"><p className="truncate font-medium text-foreground">{user.name}</p><p className="truncate text-sm text-muted-foreground">{user.email}</p></div>
          </div>
        </section>
        <section aria-labelledby="connection-heading" className="border-t border-border pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
          <h2 id="connection-heading" className="text-lg font-semibold leading-[var(--leading-heading-sm)]">Kubernetes connection</h2>
          {!status && !error ? <p className="mt-5 text-sm text-muted-foreground">Loading status...</p> : null}
          {error ? <div className="mt-5"><p role="alert" className="text-sm text-destructive">{error}</p><Button className="mt-3" variant="outline" size="sm" onClick={() => void loadStatus()}><RefreshCw />Retry</Button></div> : null}
          {status ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2">
                {status.configured ? (
                  <CheckCircle2 className="size-5 text-[var(--color-status-success)]" />
                ) : (
                  <CircleDashed className="size-5 text-muted-foreground" />
                )}
                <span className="font-medium">{status.configured ? 'Configured' : 'Not configured'}</span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.056em] text-muted-foreground">Last updated</p>
                <p className="mt-1 font-mono text-xs text-foreground">{formatUpdatedAt(status.updatedAt)}</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
