import { FaLinkedinIn } from 'react-icons/fa6'
import { SiDiscord, SiGithub, SiX, SiYoutube } from 'react-icons/si'
import Image from 'next/image'
import Link from 'next/link'

import styles from './landing.module.css'

type LandingClientProps = {
  ctaHref: '/login' | '/workspace'
  githubStars: string
}

export function LandingClient({ ctaHref, githubStars }: LandingClientProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Fulling home">
            <span className={styles.brandMark} aria-hidden="true">
              <Image src="/icon-transparent.svg" alt="" width={40} height={40} priority />
            </span>
            <span>Fulling</span>
          </Link>

          <nav className={styles.headerNav} aria-label="Primary navigation">
            <button type="button" disabled className={styles.blogLink} aria-label="Blog, coming soon">
              Blog
            </button>
            <a
              className={styles.starLink}
              href="https://github.com/FullAgent/fulling"
              aria-label={`Fulling on GitHub, ${githubStars} stars`}
            >
              <SiGithub aria-hidden="true" />
              <span>{githubStars}</span>
            </a>
            <Link href={ctaHref} className={styles.dashboardLink}>
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main id="product" className={styles.main}>
        <section className={styles.hero}>
          <figure className={styles.codeFigure}>
            <div className={styles.codeCard}>
              <figcaption className={styles.codeCaption}>
                <span className={styles.windowDots} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>workspace.ts</span>
              </figcaption>
              <pre className={styles.codePanel}>
                <code>
                  <span className={styles.syntaxPlum}>const</span>{' '}
                  workspace <span className={styles.syntaxRust}>=</span>{' '}
                  <span className={styles.syntaxCobalt}>fulling</span>.<span className={styles.syntaxTeal}>workspace</span>(
                  <span className={styles.syntaxRust}>&quot;Research&quot;</span>, {'{'}
                  {'\n  '}mission: <span className={styles.syntaxRust}>&quot;Turn questions into finished work&quot;</span>,
                  {'\n  '}knowledge: [
                  <span className={styles.syntaxRust}>&quot;brief.md&quot;</span>, <span className={styles.syntaxRust}>&quot;sources/&quot;</span>],
                  {'\n  '}skills: [
                  <span className={styles.syntaxRust}>&quot;research&quot;</span>, <span className={styles.syntaxRust}>&quot;write&quot;</span>],
                  {'\n  '}memory: <span className={styles.syntaxCobalt}>true</span>,
                  {'\n  '}scripts: [<span className={styles.syntaxRust}>&quot;collect.ts&quot;</span>, <span className={styles.syntaxRust}>&quot;draft.ts&quot;</span>],
                  {'\n  '}artifacts: [<span className={styles.syntaxRust}>&quot;report.md&quot;</span>, <span className={styles.syntaxRust}>&quot;sources.json&quot;</span>],
                  {'\n  '}access: [<span className={styles.syntaxRust}>&quot;read&quot;</span>, <span className={styles.syntaxRust}>&quot;run&quot;</span>, <span className={styles.syntaxRust}>&quot;share&quot;</span>],
                  {'\n  '}runtime: {'{'}
                  {'\n    '}status: <span className={styles.syntaxRust}>&quot;ready&quot;</span>,
                  {'\n    '}sharing: <span className={styles.syntaxRust}>&quot;enabled&quot;</span>
                  {'\n  '}{'}'}
                  {'\n'}{'}'})
                </code>
              </pre>
            </div>
          </figure>

          <div className={styles.heroCopy}>
            <div className={styles.announcement}>
              <span className={styles.newBadge}>NEW</span>
              <span>Fulling v3</span>
              <span aria-hidden="true">›</span>
            </div>

            <h1>For whatever you need done.</h1>
            <p className={styles.intro}>
              Build and share dedicated AI workspaces with skills, files, memory, scripts, and runtime.
            </p>

            <Link href={ctaHref} className={styles.previewLink}>
              Join the v3 preview →
            </Link>

            <div id="workspace-model" className={styles.capabilities}>
              <p>BUILT FOR AI WORKSPACES</p>
              <div>
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

      <footer className={styles.footer}>
        <p>© 2026 Fulling</p>
        <div className={styles.footerRight}>
          <nav className={styles.footerNav} aria-label="Footer navigation">
            <a href="https://github.com/FullAgent/fulling/tree/main/docs">Docs</a>
            <a href="https://github.com/FullAgent/fulling">GitHub</a>
            <a href="mailto:hello@fulling.ai">Contact</a>
          </nav>
          <div className={styles.socialLinks} aria-label="Social links">
            <a href="https://youtube.com" aria-label="YouTube"><SiYoutube /></a>
            <a href="https://discord.com" aria-label="Discord"><SiDiscord /></a>
            <a href="https://github.com/FullAgent/fulling" aria-label="GitHub"><SiGithub /></a>
            <a href="https://linkedin.com" aria-label="LinkedIn"><FaLinkedinIn /></a>
            <a href="https://x.com" aria-label="X"><SiX /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
