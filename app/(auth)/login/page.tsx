import { redirect } from 'next/navigation'

import { FullingBrand } from '@/components/fulling-brand'
import { getSession } from '@/lib/auth/session'

import { GitHubLoginButton } from './_components/github-login-button'

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getSession()) redirect('/workspace')

  const { error } = await searchParams

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center border-b border-border px-4 sm:px-6">
        <FullingBrand />
      </header>
      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[length:var(--text-micro)] font-medium uppercase leading-[var(--leading-micro)] tracking-[0.056em] text-muted-foreground">
            Workspace access
          </p>
          <h1 className="mt-3 text-xl font-semibold leading-[var(--leading-heading)]">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use your GitHub account to continue to Fulling.
          </p>
          {error === 'oauth' ? (
            <p role="alert" className="mt-5 text-sm text-destructive">
              GitHub sign-in could not be completed. Please try again.
            </p>
          ) : null}
          <GitHubLoginButton />
        </div>
      </section>
      <footer className="h-12 shrink-0 border-t border-border px-4 text-xs leading-[48px] text-muted-foreground sm:px-6">
        Dedicated AI workspaces
      </footer>
    </main>
  )
}
