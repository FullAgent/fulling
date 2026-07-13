import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type LandingClientProps = {
  ctaHref: '/login' | '/workspace'
}

export function LandingClient({ ctaHref }: LandingClientProps) {
  const actionLabel = ctaHref === '/workspace' ? 'Open workspace' : 'Sign in'

  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfbfa] text-[#090b10]">
      <header className="flex h-16 items-center border-b border-[#e3e7eb] bg-white/80 px-5 backdrop-blur sm:px-8 lg:px-12">
        <Link href="/" className="font-[family-name:var(--font-heading)] text-2xl font-bold">Fulling</Link>
        <Link href={ctaHref} className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-[#090b10] px-4 text-sm font-semibold text-white hover:bg-[#252a32]">
          {actionLabel} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>
      <main className="relative grid min-h-[calc(100vh-4rem)] grid-rows-[auto_1fr] lg:grid-cols-[minmax(26rem,0.78fr)_minmax(38rem,1.22fr)] lg:grid-rows-1">
        <section className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
          <p className="mb-5 text-sm font-semibold uppercase text-[#287355]">Dedicated AI workspaces</p>
          <h1 className="max-w-xl font-[family-name:var(--font-heading)] text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">Fulling</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[#52606d] sm:text-xl">Connect the Kubernetes credentials that will power your workspace runtime.</p>
          <div className="mt-8">
            <Link href={ctaHref} className="inline-flex h-12 items-center gap-2 rounded-md bg-[#090b10] px-5 font-semibold text-white hover:bg-[#252a32]">
              {actionLabel} <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <div className="relative min-h-[22rem] overflow-hidden lg:min-h-0">
          <Image src="/images/landing-workspace-concept.png" alt="Fulling workspace components arranged as a connected system" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-contain object-center p-4 sm:p-8 lg:object-right lg:p-10" />
        </div>
      </main>
    </div>
  )
}
