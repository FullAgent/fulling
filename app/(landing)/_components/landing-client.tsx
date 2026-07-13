import { FaLinkedinIn } from 'react-icons/fa6'
import { SiDiscord, SiGithub, SiX, SiYoutube } from 'react-icons/si'
import { ChevronRight, Circle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type LandingClientProps = {
  ctaHref: '/login' | '/workspace'
  githubStars: string
}

export function LandingClient({ ctaHref, githubStars }: LandingClientProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white font-[family-name:var(--font-landing-sans)] text-[#303055]">
      <header className="flex h-[72px] shrink-0 items-center border-b border-[#e8e8f2] px-5 lg:h-20">
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8844ae]"
          aria-label="Fulling home"
        >
          <span className="relative size-8 shrink-0 overflow-hidden" aria-hidden="true">
            <Image className="absolute -left-[10px] -top-[10px] max-w-none brightness-0" src="/icon-transparent.svg" alt="" width={52} height={52} priority />
          </span>
          <span className="text-[28px] font-semibold tracking-[-0.045em]">Fulling</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-10 text-[16px] font-medium xl:flex" aria-label="Primary navigation">
          <button type="button" disabled className="cursor-not-allowed text-[#a8a8b0]" aria-label="Blog, coming soon">
            Blog
          </button>
          <a className="inline-flex items-center gap-1.5 text-[#767682] transition-colors hover:text-[#8844ae]" href="https://github.com/FullAgent/fulling" aria-label={`Fulling on GitHub, ${githubStars} stars`}>
            <SiGithub className="size-5" aria-hidden="true" />
            <span>{githubStars}</span>
          </a>
        </nav>

        <Link
          href={ctaHref}
          className="ml-auto inline-flex h-10 items-center border border-[#cfcfdd] px-3 text-[14px] font-medium transition-colors hover:border-[#8844ae] hover:text-[#8844ae] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8844ae] xl:ml-2 xl:h-11"
        >
          Dashboard
        </Link>
      </header>

      <main id="product" className="flex flex-1 items-center">
        <section className="mx-auto grid w-full max-w-[1096px] items-center gap-14 px-6 py-12 sm:px-10 xl:grid-cols-[522px_minmax(0,1fr)] xl:gap-16 xl:px-0">
          <figure className="overflow-hidden border border-[#e2e2ec] bg-[#fafaff] shadow-[0_22px_60px_rgba(48,48,85,0.07)]">
            <figcaption className="relative flex h-[54px] items-center justify-center border-b border-[#e2e2ec] bg-white px-5 font-[family-name:var(--font-landing-mono)] text-[16px] text-[#8d8d9a]">
              <span className="absolute left-5 flex gap-2 text-[#d2d2df]" aria-hidden="true">
                <Circle className="size-3 fill-current" />
                <Circle className="size-3 fill-current" />
                <Circle className="size-3 fill-current" />
              </span>
              <span>workspace.ts</span>
            </figcaption>
            <pre className="min-h-[420px] overflow-x-auto px-6 py-2 font-[family-name:var(--font-landing-mono)] text-[12px] leading-[2.05] text-[#403f53] sm:px-10 sm:text-[14px] lg:px-5 lg:text-[16px] xl:min-h-[584px] xl:px-5 xl:text-[17px]">
              <code>
                <span className="text-[#8844ae]">const</span>{' '}
                <span className="text-[#403f53]">workspace</span>{' '}
                <span className="text-[#984e4d]">=</span>{' '}
                <span className="text-[#3b61b0]">fulling</span>.<span className="text-[#096e72]">workspace</span>(<span className="text-[#984e4d]">&quot;Research&quot;</span>)
                {'\n'}
                {'\n'}
                <span className="text-[#403f53]">mission</span>: <span className="text-[#984e4d]">&quot;Turn questions into finished work&quot;</span>
                {'\n'}
                <span className="text-[#403f53]">knowledge</span>: [<span className="text-[#984e4d]">&quot;brief.md&quot;</span>, <span className="text-[#984e4d]">&quot;sources/&quot;</span>]
                {'\n'}
                <span className="text-[#403f53]">skills</span>: [<span className="text-[#984e4d]">&quot;research&quot;</span>, <span className="text-[#984e4d]">&quot;write&quot;</span>]
                {'\n'}
                <span className="text-[#403f53]">memory</span>: <span className="text-[#3b61b0]">true</span>
                {'\n'}
                <span className="text-[#403f53]">runtime</span>: <span className="text-[#984e4d]">&quot;ready&quot;</span>
              </code>
            </pre>
          </figure>

          <div className="max-w-[510px] xl:self-start xl:justify-self-start xl:pt-2">
            <div className="flex items-center gap-2 text-[18px] text-[#767682]">
              <span className="border border-[#1782a8] px-1.5 py-0.5 font-[family-name:var(--font-landing-mono)] text-[11px] font-semibold text-[#1782a8]">NEW</span>
              <span>Fulling v3</span>
              <ChevronRight className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </div>

            <h1 className="mt-5 max-w-[500px] font-[family-name:var(--font-landing-mono)] text-[42px] font-semibold leading-[1.08] tracking-[-0.055em] text-[#303055] sm:text-[52px] lg:text-[58px]">
              For whatever you need done.
            </h1>
            <p className="mt-6 max-w-[510px] text-[19px] leading-[1.75] text-[#767682] lg:text-[22px]">
              Build and share dedicated AI workspaces with skills, files, memory, scripts, and runtime.
            </p>

            <Link
              href={ctaHref}
              className="mt-14 inline-flex font-[family-name:var(--font-landing-mono)] text-[18px] font-medium text-[#303055] transition-colors hover:text-[#8844ae] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8844ae] lg:text-[22px] xl:mt-[76px]"
            >
              &gt; npx fulling create
            </Link>

            <div id="workspace-model" className="mt-20 xl:mt-40">
              <p className="text-[14px] font-medium text-[#a8a8b0]">BUILT FOR AI WORKSPACES</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-[family-name:var(--font-landing-mono)] text-[12px] font-medium text-[#a8a8b0] sm:gap-x-8">
                <span>MISSION</span>
                <span>KNOWLEDGE</span>
                <span>SKILLS</span>
                <span>MEMORY</span>
                <span>SCRIPTS</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex min-h-[59px] shrink-0 flex-col gap-5 px-5 py-6 text-[16px] text-[#8d8d9a] sm:flex-row sm:items-center sm:py-0">
        <span>© 2026 Fulling</span>
        <nav className="flex items-center gap-8 sm:ml-auto" aria-label="Footer navigation">
          <a className="hover:text-[#303055]" href="https://github.com/FullAgent/fulling/tree/main/docs">Docs</a>
          <a className="hover:text-[#303055]" href="https://github.com/FullAgent/fulling">GitHub</a>
          <a className="hover:text-[#303055]" href="mailto:hello@fulling.ai">Contact</a>
        </nav>
        <div className="flex items-center gap-5 sm:ml-8" aria-label="Social links">
          <a className="hover:text-[#303055]" href="https://youtube.com" aria-label="YouTube"><SiYoutube className="size-4" /></a>
          <a className="hover:text-[#303055]" href="https://discord.com" aria-label="Discord"><SiDiscord className="size-4" /></a>
          <a className="hover:text-[#303055]" href="https://github.com/FullAgent/fulling" aria-label="GitHub"><SiGithub className="size-4" /></a>
          <a className="hover:text-[#303055]" href="https://linkedin.com" aria-label="LinkedIn"><FaLinkedinIn className="size-4" /></a>
          <a className="hover:text-[#303055]" href="https://x.com" aria-label="X"><SiX className="size-3.5" /></a>
        </div>
      </footer>
    </div>
  )
}
