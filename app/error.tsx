'use client'

import { useEffect } from 'react'
import { CircleAlert, House, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      <div className="w-full max-w-lg border-y border-border py-8">
        <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
        <p className="mt-5 font-mono text-[length:var(--text-micro)] font-medium uppercase tracking-[0.056em] text-muted-foreground">Application error</p>
        <h1 className="mt-2 text-xl font-semibold leading-[var(--leading-heading)]">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The request could not be completed. Try again or return to Fulling.
        </p>
        {error.digest ? (
          <p className="mt-6 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            <RefreshCw /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <House /> Go home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
