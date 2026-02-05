'use client';

import { useState } from 'react';
import { MdDeleteOutline, MdMoreHoriz, MdPause, MdPlayArrow, MdRefresh, MdSettings } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { ProjectStatus } from '@prisma/client';

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectOperations } from '@/hooks/use-project-operations';

interface ProjectActionsMenuProps {
  projectId: string;
  projectName: string;
  status: ProjectStatus;
}

export function ProjectActionsMenu({ projectId, projectName, status }: ProjectActionsMenuProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { executeOperation, loading } = useProjectOperations(projectId);

  // Determine available actions based on status
  const showStart = status === 'STOPPED';
  const showStop = status !== 'STOPPED';

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    executeOperation('DELETE');
  };

  const handleSettingsClick = () => {
    router.push(`/projects/${projectId}/settings`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <MdMoreHoriz className="w-5 h-5" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-32 bg-popover/90 backdrop-blur-md"
        >
          {/* Start/Stop based on status */}
          {showStart && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                executeOperation('START');
              }}
              disabled={loading !== null}
              className="gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/5"
            >
              {loading === 'START' ? (
                <>
                  <MdRefresh className="h-[18px] w-[18px] animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <MdPlayArrow className="h-[18px] w-[18px]" />
                  Start
                </>
              )}
            </DropdownMenuItem>
          )}
          {showStop && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                executeOperation('STOP');
              }}
              disabled={loading !== null}
              className="gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/5"
            >
              {loading === 'STOP' ? (
                <>
                  <MdRefresh className="h-[18px] w-[18px] animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <MdPause className="h-[18px] w-[18px]" />
                  Stop
                </>
              )}
            </DropdownMenuItem>
          )}

          {/* Settings */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleSettingsClick();
            }}
            className="gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/5"
          >
            <MdSettings className="h-[18px] w-[18px]" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border/60 mx-2 my-1" />

          {/* Delete */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick();
            }}
            disabled={loading !== null}
            className="gap-3 px-3 py-2 text-xs font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <MdDeleteOutline className="h-[18px] w-[18px] text-red-500" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete &quot;{projectName}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate all resources (databases, sandboxes) and cannot be undone.
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
