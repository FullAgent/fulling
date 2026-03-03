'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function GitHubAppCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const installationId = searchParams.get('installation_id')
      const setupAction = searchParams.get('setup_action')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        setStatus('error')
        setErrorMessage(errorDescription || error)
        return
      }

      if (!installationId) {
        setStatus('error')
        setErrorMessage('Missing installation_id')
        return
      }

      try {
        const response = await fetch(
          `/api/github/app/callback?installation_id=${installationId}&setup_action=${setupAction || ''}`
        )

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to complete installation')
        }

        setStatus('success')

        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'github-app-installed',
              success: true,
              installationId,
            },
            window.location.origin
          )
          setTimeout(() => {
            window.close()
          }, 500)
        } else {
          setTimeout(() => {
            window.location.href = '/projects?github=connected'
          }, 1000)
        }
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Completing GitHub App installation...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-foreground font-medium">GitHub App installed successfully!</p>
            <p className="text-muted-foreground text-sm mt-2">This window will close automatically...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-foreground font-medium">Installation failed</p>
            <p className="text-muted-foreground text-sm mt-2">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  )
}
