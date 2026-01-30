'use client';

import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { MdOpenInNew, MdRefresh } from 'react-icons/md';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import SettingsDialog from '@/components/dialog/settings-dialog';
import { Button } from '@/components/ui/button';
import { useProject } from '@/hooks/use-project';
import { commitChanges, initializeRepo } from '@/lib/services/repoService';

import { SettingsLayout } from '../_components/settings-layout';

export default function GithubPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();

  const { data: project, isLoading: projectLoading } = useProject(projectId);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Create a new repository on GitHub
  const handleInitialize = async () => {
    if (project?.githubRepo || isInitializing) return;

    setIsInitializing(true);
    try {
      const result = await initializeRepo(projectId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        if (result.code === 'GITHUB_NOT_BOUND') {
          toast.error('Please connect your GitHub account first');
          setShowSettings(true);
        } else {
          toast.error(result.message);
        }
      }
    } catch (_error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsInitializing(false);
    }
  };

  // Commit changes to the repository and push to GitHub
  const handleCommit = async () => {
    if (isCommitting) return;

    setIsCommitting(true);
    try {
      const result = await commitChanges(projectId);
      if (result.success) {
        toast.success(result.message);
      } else {
        if (result.code === 'GITHUB_NOT_BOUND') {
          toast.error('Please connect your GitHub account first');
          setShowSettings(true);
        } else {
          toast.error(result.message);
        }
      }
    } catch (_error) {
      toast.error('Failed to commit changes');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <SettingsLayout
      title="GitHub Integration"
      description="Connect your project to GitHub for version control and collaboration"
      loading={projectLoading}
    >
      <div className="max-w-3xl space-y-6">
        {/* Connection Status Section */}
        <div className="p-6 bg-card/50 border border-border rounded-lg">
          {/* Visual Header */}
          <div className="flex items-start gap-5 mb-8">
            <div className="p-3 bg-secondary/50 rounded-xl border border-border">
              <FaGithub className="w-8 h-8 text-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-foreground">
                {project?.githubRepo ? 'Connected to GitHub' : 'GitHub Repository'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                {project?.githubRepo
                  ? 'Your project is currently active and synced with a remote GitHub repository. You can push your latest changes below.'
                  : 'Initialize a new repository to start tracking changes. This will create a private repository in your GitHub account and push the initial code.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pl-[76px]">
            {project?.githubRepo ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-md border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Repository URL</span>
                  <a
                    href={project.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline text-primary hover:text-primary-hover font-mono text-sm break-all"
                  >
                    {project.githubRepo}
                    <MdOpenInNew className="w-3.5 h-3.5" />
                  </a>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCommit}
                    disabled={isCommitting}
                    className="min-w-[140px]"
                  >
                    {isCommitting ? (
                      <>
                        <MdRefresh className="mr-2 h-4 w-4 animate-spin" />
                        Pushing...
                      </>
                    ) : (
                      <>
                        <MdRefresh className="mr-2 h-4 w-4" />
                        Push Changes
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(project.githubRepo!, '_blank')}
                  >
                    View on GitHub
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleInitialize}
                disabled={isInitializing}
                size="lg"
              >
                {isInitializing ? (
                  <>
                    <MdRefresh className="mr-2 h-5 w-5 animate-spin" />
                    Creating Repository...
                  </>
                ) : (
                  <>
                    <FaGithub className="mr-2 h-5 w-5" />
                    Initialize & Push to GitHub
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Global Settings Link */}
        <div className="flex items-center justify-between p-4 bg-secondary/20 border border-border/50 rounded-lg">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-foreground">GitHub Account Settings</h4>
            <p className="text-xs text-muted-foreground">Manage your global GitHub connection and personal access tokens.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            Open Settings
          </Button>
        </div>

        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          defaultTab="github"
        />
      </div>
    </SettingsLayout>
  );
}
