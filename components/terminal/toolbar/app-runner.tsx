'use client';

import { useState } from 'react';
import { MdRefresh, MdRocketLaunch } from 'react-icons/md';
import type { Prisma } from '@prisma/client';

import { useAppRunner } from '@/hooks/use-app-runner';
import { cn } from '@/lib/utils';

import { AppRunnerDialog } from './app-runner-dialog';
import { DirectorySelector } from './directory-selector';

type Sandbox = Prisma.SandboxGetPayload<object>;

interface AppRunnerProps {
  sandbox: Sandbox | undefined;
}

export function AppRunner({ sandbox }: AppRunnerProps) {
  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const [deployDirectory, setDeployDirectory] = useState('./');
  const {
    isRunningSkill,
    runDeploySkill,
  } = useAppRunner(sandbox?.id, deployDirectory);

  const handleRunSkill = () => {
    setShowRunConfirm(true);
  };

  const handleConfirmRun = () => {
    setShowRunConfirm(false);
    runDeploySkill();
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
          onClick={handleRunSkill}
          disabled={isRunningSkill || !sandbox}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 disabled:cursor-not-allowed',
            'text-foreground font-semibold hover:text-white hover:bg-zinc-800 disabled:opacity-50'
          )}
          title="Generate deployment files and push changes via the /fulling-deploy skill."
        >
          {isRunningSkill ? (
            <MdRefresh className="h-3 w-3 animate-spin" />
          ) : (
            <MdRocketLaunch className="h-3 w-3 text-blue-500" />
          )}
          <span>{isRunningSkill ? 'Starting...' : 'Prepare Deploy'}</span>
        </button>
      </div>

      {/* Separator */}
      <div className="h-4 w-[1px] bg-[#3e3e42]" />

      {/* Confirmation Alert Dialog */}
      <AppRunnerDialog
        open={showRunConfirm}
        onOpenChange={setShowRunConfirm}
        onConfirm={handleConfirmRun}
      />
    </>
  );
}
