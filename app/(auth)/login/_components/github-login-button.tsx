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
    <div className="mt-8 border-t border-border pt-6">
      <Button type="button" size="lg" className="w-full" disabled={isPending} onClick={handleSignIn}>
        {isPending ? <LoaderCircle className="animate-spin" /> : <Github />}
        {isPending ? 'Connecting...' : 'Continue with GitHub'}
      </Button>
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
