'use client';

import { useState } from 'react';
import type { Prisma } from '@prisma/client';
import { Loader2, Play, Square } from 'lucide-react';

import { useAppRunner } from '@/hooks/use-app-runner';
import { cn } from '@/lib/utils';

import { AppRunnerDialog } from './app-runner-dialog';
import { DirectorySelector } from './directory-selector';

type Sandbox = Prisma.SandboxGetPayload<object>;

interface AppRunnerProps {
  sandbox: Sandbox | undefined;
}

export function AppRunner({ sandbox }: AppRunnerProps) {
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [deployDirectory, setDeployDirectory] = useState('./');
  const {
    isStartingApp,
    isStoppingApp,
    isAppRunning,
    startApp,
    stopApp,
  } = useAppRunner(sandbox?.id, deployDirectory);

  // Toggle app start/stop
  const handleToggleApp = () => {
    if (isAppRunning) {
      stopApp();
    } else {
      setShowStartConfirm(true); // Open confirmation modal
    }
  };

  const handleConfirmStart = () => {
    setShowStartConfirm(false);
    startApp();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Directory Selector */}
        <DirectorySelector
          sandboxId={sandbox?.id}
          value={deployDirectory}
          onChange={setDeployDirectory}
        />



        {/* Run App Button */}
        <button
          onClick={handleToggleApp}
          disabled={isStartingApp || isStoppingApp || !sandbox}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 disabled:cursor-not-allowed',
            isAppRunning
              ? 'text-green-400 hover:text-red-400 hover:bg-red-400/10 bg-green-400/10'
              : 'text-gray-300 hover:text-white hover:bg-[#37373d] disabled:opacity-50'
          )}
          title={
            isAppRunning
              ? 'Click to stop. Your app will no longer be accessible.'
              : 'Build and run your app in production mode. It will keep running even if you close this terminal.'
          }
        >
          {isStartingApp || isStoppingApp ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isAppRunning ? (
            <Square className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          <span>
            {isStartingApp ? 'Starting...' : isStoppingApp ? 'Stopping...' : isAppRunning ? 'Running' : 'Run App'}
          </span>
        </button>
      </div>

      {/* Separator */}
      <div className="h-4 w-[1px] bg-[#3e3e42]" />

      {/* Confirmation Alert Dialog */}
      <AppRunnerDialog
        open={showStartConfirm}
        onOpenChange={setShowStartConfirm}
        onConfirm={handleConfirmStart}
        sandboxUrl={sandbox?.publicUrl}
      />
    </>
  );
}
