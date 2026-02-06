'use client';

import { useState } from 'react';
import { MdDeleteOutline, MdMoreHoriz, MdPause, MdPlayArrow, MdRefresh, MdSettings } from 'react-icons/md';
import { ProjectStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useProjectOperations } from '@/hooks/use-project-operations';

interface ProjectActionsMenuProps {
  projectId: string;
  projectName: string;
  status: ProjectStatus;
}

export function ProjectActionsMenu({ projectId, projectName, status }: ProjectActionsMenuProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const { executeOperation, loading } = useProjectOperations(projectId);

  // Determine available actions based on status
  const showStart = status === 'STOPPED';
  const showStop = status !== 'STOPPED';

  // Check if the confirmation input matches the project name
  const isConfirmValid = confirmInput === projectName;

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!isConfirmValid) return;
    setShowDeleteDialog(false);
    setConfirmInput('');
    executeOperation('DELETE');
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) {
      setConfirmInput('');
    }
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
      <FullScreenDialog open={showDeleteDialog} onOpenChange={handleDialogOpenChange}>
        <FullScreenDialogContent>
          <FullScreenDialogHeader>
            <FullScreenDialogTitle>
              Are you sure you want to delete <br />
              <span className="text-white">&quot;{projectName}&quot;</span>?
            </FullScreenDialogTitle>
            <FullScreenDialogDescription>
              This will terminate all resources (databases, sandboxes) and cannot be undone.
            </FullScreenDialogDescription>
          </FullScreenDialogHeader>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              Type <span className="text-white select-all">{projectName}</span> to confirm
            </Label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={projectName}
              className="bg-background border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground/30 focus-visible:border-red-500 focus-visible:ring-red-500/50 font-mono text-sm shadow-inner"
            />
          </div>

          <FullScreenDialogFooter>
            <FullScreenDialogClose>
              Cancel
            </FullScreenDialogClose>
            <FullScreenDialogAction
              onClick={handleDeleteConfirm}
              disabled={!isConfirmValid}
              variant="destructive"
            >
              Permanently Delete
            </FullScreenDialogAction>
          </FullScreenDialogFooter>
        </FullScreenDialogContent>
      </FullScreenDialog>
    </>
  );
}
