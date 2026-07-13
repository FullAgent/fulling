'use client'

import { useState } from 'react'
import { Github, LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth-client'

export function GitHubLoginButton() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setIsPending(true)
    setError(null)
    const result = await signIn.social({
      provider: 'github',
      callbackURL: '/workspace',
      errorCallbackURL: '/login?error=oauth',
    })
    if (result?.error) {
      setError('GitHub sign-in could not be started. Please try again.')
      setIsPending(false)
    }
  }

  return (
    <div className="mt-8">
      <Button type="button" size="lg" className="h-12 w-full bg-[#101418] text-white hover:bg-[#2a3037]" disabled={isPending} onClick={handleSignIn}>
        {isPending ? <LoaderCircle className="size-5 animate-spin" /> : <Github className="size-5" />}
        {isPending ? 'Connecting...' : 'Continue with GitHub'}
      </Button>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
