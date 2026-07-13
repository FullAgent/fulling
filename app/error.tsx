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
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-5 py-12 text-[#171a1f]">
      <div className="w-full max-w-xl">
        <CircleAlert className="size-10 text-destructive" aria-hidden="true" />
        <h1 className="mt-6 text-4xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-[#5e6974]">
          The request could not be completed. Try again or return to Fulling.
        </p>
        {error.digest ? (
          <p className="mt-6 font-mono text-xs text-[#5e6974]">Reference: {error.digest}</p>
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
