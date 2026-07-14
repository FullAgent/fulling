import { ArrowLeft, CircleHelp, House } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      <div className="w-full max-w-lg border-y border-border py-8">
        <CircleHelp className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-5 font-mono text-[length:var(--text-micro)] font-medium uppercase tracking-[0.056em] text-muted-foreground">404</p>
        <h1 className="mt-2 text-xl font-semibold leading-[var(--leading-heading)]">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The page does not exist or has moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <House /> Go home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workspace">
              <ArrowLeft /> Open workspace
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
