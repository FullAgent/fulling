import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/session'

import { GitHubLoginButton } from './_components/github-login-button'

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getSession()) redirect('/workspace')

  const { error } = await searchParams

  return (
    <main className="grid min-h-screen bg-[#f7f8f6] lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#101418]"
          >
            Fulling
          </Link>
          <h1 className="mt-14 text-4xl font-semibold text-[#101418]">
            Sign in to your workspace
          </h1>
          <p className="mt-4 text-base text-[#66717d]">Use your GitHub account to continue.</p>
          {error === 'oauth' ? (
            <p role="alert" className="mt-5 text-sm text-destructive">
              GitHub sign-in could not be completed. Please try again.
            </p>
          ) : null}
          <GitHubLoginButton />
        </div>
      </section>
      <div className="relative hidden overflow-hidden border-l border-[#e1e5e8] bg-white lg:block">
        <div className="absolute inset-10 bg-[url('/images/landing-workspace-concept.png')] bg-contain bg-center bg-no-repeat" />
      </div>
    </main>
  )
}
