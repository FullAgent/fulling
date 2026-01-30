/**
 * ProjectCardDropdown Component
 *
 * Dropdown menu for project operations (Start/Stop/Delete)
 * Includes delete confirmation dialog
 */

'use client';

import { useState } from 'react';
import { MdDeleteOutline, MdMoreVert, MdPlayArrow, MdRefresh, MdStop } from 'react-icons/md';
import type { Prisma } from '@prisma/client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog-vscode';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectOperations } from '@/hooks/use-project-operations';
import { getAvailableProjectActions } from '@/lib/util/action';

type ProjectWithResources = Prisma.ProjectGetPayload<{
  include: {
    sandboxes: true;
    databases: true;
  };
}>;

interface ProjectCardDropdownProps {
  project: ProjectWithResources;
}

export default function ProjectCardDropdown({ project }: ProjectCardDropdownProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { executeOperation, loading } = useProjectOperations(project.id);
  const availableActions = getAvailableProjectActions(project);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    executeOperation('DELETE');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MdMoreVert className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-md">
          {availableActions.includes('START') && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                executeOperation('START');
              }}
              disabled={loading !== null}
            >
              {loading === 'START' ? (
                <>
                  <MdRefresh className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <MdPlayArrow className="mr-2 h-4 w-4" />
                  Start
                </>
              )}
            </DropdownMenuItem>
          )}
          {availableActions.includes('STOP') && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                executeOperation('STOP');
              }}
              disabled={loading !== null}
            >
              {loading === 'STOP' ? (
                <>
                  <MdRefresh className="mr-2 h-4 w-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <MdStop className="mr-2 h-4 w-4" />
                  Stop
                </>
              )}
            </DropdownMenuItem>
          )}
          {availableActions.includes('DELETE') && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
              disabled={loading !== null}
              className="text-destructive"
            >
              <MdDeleteOutline className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete &quot;{project.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate all resources
              (databases, sandboxes) and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}