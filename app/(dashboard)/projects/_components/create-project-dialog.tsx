/**
 * CreateProjectDialog Component
 *
 * Dialog for creating new projects
 * Handles project creation with kubeconfig validation
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  FullScreenDialog,
  FullScreenDialogAction,
  FullScreenDialogClose,
  FullScreenDialogContent,
  FullScreenDialogDescription,
  FullScreenDialogFooter,
  FullScreenDialogHeader,
  FullScreenDialogTitle,
} from '@/components/ui/fullscreen-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProject } from '@/lib/actions/project';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    startTransition(async () => {
      const result = await createProject(projectName, description);

      if (!result.success) {
        toast.error(result.error, { duration: 6000 });
        return;
      }

      toast.success('Creating project...');
      setProjectName('');
      setDescription('');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <FullScreenDialog open={open} onOpenChange={onOpenChange}>
      <FullScreenDialogContent>
        <FullScreenDialogHeader>
          <FullScreenDialogTitle>Create New Project</FullScreenDialogTitle>
          <FullScreenDialogDescription>
            Enter a name and optional description for your new project.
          </FullScreenDialogDescription>
        </FullScreenDialogHeader>

        <form onSubmit={handleCreateProject} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-sm font-medium">
              Project Name
            </Label>
            <Input
              id="project-name"
              placeholder="my-awesome-app"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Input
              id="project-description"
              placeholder="A brief description of your project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Add a brief description to help identify this project.
            </p>
          </div>

          {/* Actions */}
          <FullScreenDialogFooter>
            <FullScreenDialogClose type="button" disabled={isPending}>
              Cancel
            </FullScreenDialogClose>
            <FullScreenDialogAction
              type="submit"
              disabled={isPending || !projectName.trim()}
            >
              {isPending ? 'Creating...' : 'Create Project'}
            </FullScreenDialogAction>
          </FullScreenDialogFooter>
        </form>
      </FullScreenDialogContent>
    </FullScreenDialog>
  );
}
