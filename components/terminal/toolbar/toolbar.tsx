/**
 * TerminalToolbar Component
 *
 * Toolbar for terminal with tabs, status, and operation controls
 */

'use client';

import { useState } from 'react';
import { MdLan, MdPsychology } from 'react-icons/md';
import type { Prisma } from '@prisma/client';
import { useRouter } from 'next/navigation';

import { AppRunner } from './app-runner';
import { NetworkDialog } from './network-dialog';
import { buildNetworkEndpoints } from './network-endpoints';
import { type Tab,TerminalTabs } from './terminal-tabs';

type Project = Prisma.ProjectGetPayload<{
  include: {
    sandboxes: true;
    databases: true;
  };
}>;

type Sandbox = Prisma.SandboxGetPayload<object>;

export interface TerminalToolbarProps {
  /** Project data */
  project: Project;
  /** Sandbox data */
  sandbox: Sandbox | undefined;
  /** Terminal tabs */
  tabs: Tab[];
  /** Active tab ID */
  activeTabId: string;
  /** Callback when tab is selected */
  onTabSelect: (tabId: string) => void;
  /** Callback when tab is closed */
  onTabClose: (tabId: string) => void;
  /** Callback when new tab is added */
  onTabAdd: () => void;
  /** FileBrowser credentials (optional) */
  fileBrowserCredentials?: {
    username: string;
    password: string;
  };
  /** Editor password (optional) */
  editorPassword?: string;
}

/**
 * Terminal toolbar with tabs and operations
 */
export function TerminalToolbar({
  project,
  sandbox,
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabAdd,
  fileBrowserCredentials,
  editorPassword,
}: TerminalToolbarProps) {
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const router = useRouter();

  const networkEndpoints = buildNetworkEndpoints({
    sandbox,
    fileBrowserCredentials,
    editorPassword,
  });

  return (
    <>
      <div className="h-12 bg-sidebar-background border-b border-[#3e3e42] flex items-center justify-between">
        {/* Terminal Tabs */}
        <TerminalTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={onTabSelect}
          onTabClose={onTabClose}
          onTabAdd={onTabAdd}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <AppRunner sandbox={sandbox} />

          {/* Editor Button - navigates to embedded VS Code server */}
          <button
            onClick={() => router.push(`/projects/${project.id}/brain`)}
            className="px-2 py-1 text-xs text-foreground font-semibold hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
            title="Open Editor"
          >
            <MdPsychology className="h-3.5 w-3.5 text-purple-500" />
            <span>Editor</span>
          </button>

          {/* Network Button */}
          <button
            onClick={() => setShowNetworkDialog(true)}
            className="px-2 py-1 text-xs text-foreground font-semibold hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
            title="View network endpoints"
          >
            <MdLan className="h-3 w-3 text-blue-500" />
            <span>Network</span>
          </button>
        </div>
      </div>

      {/* Network Dialog */}
      <NetworkDialog
        open={showNetworkDialog}
        onOpenChange={setShowNetworkDialog}
        endpoints={networkEndpoints}
        sandboxId={sandbox?.id}
      />
    </>
  );
}
