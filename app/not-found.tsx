import { ArrowLeft, CircleHelp, House } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-5 py-12 text-[#171a1f]">
      <div className="w-full max-w-xl">
        <CircleHelp className="size-10 text-[#5e6974]" aria-hidden="true" />
        <p className="mt-6 text-sm font-semibold text-[#287355]">404</p>
        <h1 className="mt-2 text-4xl font-semibold">Page not found</h1>
        <p className="mt-3 text-[#5e6974]">
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
