'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createDatabase } from '@/lib/actions/database'

interface AddDatabaseCardProps {
  projectId: string
  projectName: string
}

export function AddDatabaseCard({ projectId }: AddDatabaseCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreateDatabase = () => {
    startTransition(async () => {
      const result = await createDatabase(projectId)

      if (!result.success) {
        toast.error(result.error || 'Failed to create database')
        return
      }

      toast.success('Database is being created...')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>No Database</CardTitle>
        <CardDescription>
          This project doesn&apos;t have a database yet. Add a PostgreSQL database to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleCreateDatabase}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Creating Database...' : 'Add PostgreSQL Database'}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          A PostgreSQL cluster will be created with 1Gi storage, 100m CPU, and 128Mi memory.
        </p>
      </CardContent>
    </Card>
  )
}
