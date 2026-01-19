'use client';

import { useState } from 'react';
import type { Prisma } from '@prisma/client';
import { Folder, Loader2, Play, Square } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppRunner } from '@/hooks/use-app-runner';
import { AppRunnerDialog } from './app-runner-dialog';

type Sandbox = Prisma.SandboxGetPayload<object>;

interface AppRunnerProps {
  sandbox: Sandbox | undefined;
}

export function AppRunner({ sandbox }: AppRunnerProps) {
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const {
    isStartingApp,
    isStoppingApp,
    isAppRunning,
    startApp,
    stopApp,
  } = useAppRunner(sandbox?.id);

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
        <div className="flex items-center gap-3 mr-1">
          <div className="relative group cursor-pointer">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Folder className="h-3.5 w-3.5 text-[#858585] group-hover:text-[#c5c5c5] transition-colors" />
            </div>
            <input
              type="text"
              value="./"
              readOnly
              className="bg-[#1e1e1e] border border-[#3e3e42] text-[#cccccc] text-xs rounded pl-8 pr-3 py-1 h-[26px] font-mono w-[80px] focus:outline-none focus:border-[#007fd4] hover:bg-[#252526] hover:border-[#505055] transition-all cursor-pointer select-none"
              title="Change deploy directory"
            />
          </div>
          
          {/* Separator */}
          <div className="h-4 w-[1px] bg-[#3e3e42]" />
        </div>

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
