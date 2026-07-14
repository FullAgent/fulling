'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, Save, Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import {
  formatUpdatedAt,
  type KubeconfigStatus,
  parseKubeconfigStatus,
} from '../../../_components/kubeconfig-status'

type ApiError = { message?: unknown }

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ApiError
    return typeof body.message === 'string' ? body.message : fallback
  } catch {
    return fallback
  }
}

export function KubeconfigForm() {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<KubeconfigStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadStatus = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await fetch('/api/kubeconfig', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(await readError(response, 'Could not load kubeconfig status.'))
      }
      setStatus(parseKubeconfigStatus(await response.json()))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load kubeconfig status.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  async function handleSave() {
    setError(null)
    setNotice(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/kubeconfig', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        throw new Error(await readError(response, 'Could not save kubeconfig.'))
      }

      setStatus(parseKubeconfigStatus(await response.json()))
      setContent('')
      setNotice('Kubeconfig saved. The stored content remains hidden.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save kubeconfig.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setError(null)
    setNotice(null)
    setIsDeleting(true)

    try {
      const response = await fetch('/api/kubeconfig', { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(await readError(response, 'Could not delete kubeconfig.'))
      }

      setStatus(parseKubeconfigStatus(await response.json()))
      setContent('')
      setNotice('Kubeconfig deleted.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete kubeconfig.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[var(--page-max-width)] px-4 py-10 sm:px-6 sm:py-12">
      <header className="border-b border-border pb-8">
        <p className="font-mono text-[length:var(--text-micro)] font-medium uppercase leading-[var(--leading-micro)] tracking-[0.056em] text-muted-foreground">Settings</p>
        <h1 className="mt-2 text-xl font-semibold leading-[var(--leading-heading)]">Kubeconfig</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Fulling validates this credential against the selected Kubernetes cluster before storing
          it as plaintext. Saved content is never displayed again.
        </p>
      </header>

      <section className="py-8" aria-labelledby="status-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="status-heading" className="text-lg font-semibold">
              Saved credential
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? 'Loading status...'
                : status?.configured
                  ? `Configured. Last updated ${formatUpdatedAt(status.updatedAt)}.`
                  : 'No kubeconfig is configured.'}
            </p>
          </div>
          {status?.configured ? (
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-status-success)]">
              <CheckCircle2 className="size-5" aria-hidden="true" />
              Configured
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-border py-8" aria-labelledby="editor-heading">
        <div className="max-w-3xl">
          <h2 id="editor-heading" className="text-lg font-semibold">
            {status?.configured ? 'Replace kubeconfig' : 'Configure kubeconfig'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Paste the complete replacement. Existing content is intentionally not prefilled.
          </p>
          <Label htmlFor="kubeconfig" className="mt-6">
            Kubeconfig content
          </Label>
          <Textarea
            id="kubeconfig"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="apiVersion: v1"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="mt-2 min-h-72 resize-y font-mono text-xs leading-5"
          />

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm" aria-live="polite">
              {error ? <p role="alert" className="text-destructive">{error}</p> : null}
              {notice ? <p className="text-[var(--color-status-success)]">{notice}</p> : null}
            </div>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || isDeleting || content.trim().length === 0}
            >
              {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
              {isSaving ? 'Validating...' : status?.configured ? 'Replace' : 'Save'}
            </Button>
          </div>
        </div>
      </section>

      {status?.configured ? (
        <section className="border-t border-border py-8" aria-labelledby="delete-heading">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="delete-heading" className="text-lg font-semibold">Delete kubeconfig</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your account and session remain active after deletion.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isDeleting || isSaving}>
                  <Trash2 /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete the saved kubeconfig?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Kubernetes operations will remain unavailable until you configure another
                    credential.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructiveSolid"
                    onClick={() => void handleDelete()}
                  >
                    Delete kubeconfig
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>
      ) : null}
    </main>
  )
}
