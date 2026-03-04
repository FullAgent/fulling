'use client'

import { useState } from 'react'
import { MdRefresh } from 'react-icons/md'
import { Project } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import SettingsDialog from '@/components/dialog/settings-dialog'
import { commitChanges, initializeRepo } from '@/lib/services/repoService'

interface RepoStatusIndicatorProps {
  project: Pick<Project, 'id' | 'githubRepo' | 'name' | 'githubRepoFullName' | 'githubRepoId' | 'githubAppInstallationId'>
}

export function RepoStatusIndicator({ project }: RepoStatusIndicatorProps) {
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const repoFullName = project.githubRepoFullName || project.githubRepo
  const hasRepo = Boolean(repoFullName)

  // Create a new repository on GitHub
  const handleInitialize = async () => {
    if (hasRepo || isInitializing) return

    setIsInitializing(true)
    try {
      const result = await initializeRepo(project.id)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        if (result.code === 'GITHUB_NOT_BOUND') {
          toast.error('Please connect your GitHub account first')
          setShowSettings(true)
        } else {
          toast.error(result.message)
        }
      }
    } catch (_error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsInitializing(false)
    }
  }

  // Commit changes to the repository and push to GitHub
  const handleCommit = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering other clicks if needed
    if (isCommitting) return

    setIsCommitting(true)
    try {
      const result = await commitChanges(project.id)
      if (result.success) {
        toast.success(result.message)
      } else {
        if (result.code === 'GITHUB_NOT_BOUND') {
          toast.error('Please connect your GitHub account first')
          setShowSettings(true)
        } else {
          toast.error(result.message)
        }
      }
    } catch (_error) {
      toast.error('Failed to commit changes')
    } finally {
      setIsCommitting(false)
    }
  }

  const isLoading = isInitializing || isCommitting

  const repoUrl = repoFullName 
    ? `https://github.com/${repoFullName}` 
    : null

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-1">
          <div className="p-0.5">
            {(!hasRepo && isInitializing) ? (
              <MdRefresh className="w-3 h-3 animate-spin text-blue-500" />
            ) : (
              <MdRefresh className="w-3 h-3 text-blue-500" />
            )}
          </div>
          
          {hasRepo ? (
            <a 
              href={repoUrl!}
              target="_blank"
              rel="noopener noreferrer" 
              className="hover:underline cursor-pointer"
            >
              {repoFullName}
            </a>
          ) : (
            <button 
              className={`cursor-pointer hover:underline text-blue-500 ${isInitializing ? 'opacity-70' : ''}`}
              onClick={handleInitialize}
              disabled={isInitializing}
            >
               {isInitializing ? 'Syncing...' : 'Sync to GitHub'}
            </button>
          )}
        </div>

        {hasRepo && (
          <button 
            className="flex items-center gap-1 px-1 rounded cursor-pointer transition-colors hover:bg-white/10"
            onClick={handleCommit}
            title="Sync changes"
            disabled={isCommitting}
          >
              {isLoading ? (
                <MdRefresh className="w-4 h-4 animate-spin" />
              ) : (
                <MdRefresh className="w-4 h-4" />
              )}
          </button>
        )}
      </div>

      <SettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings}
        defaultTab="github"
      />
    </>
  )
}
