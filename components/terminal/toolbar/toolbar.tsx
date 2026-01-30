/**
 * TerminalToolbar Component
 *
 * Toolbar for terminal with tabs, status, and operation controls
 */

'use client';

import { useState } from 'react';
import type { Prisma } from '@prisma/client';
import { MdLan } from 'react-icons/md';

import { AppRunner } from './app-runner';
import { NetworkDialog } from './network-dialog';
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
}

/**
 * Terminal toolbar with tabs and operations
 */
export function TerminalToolbar({
  sandbox,
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabAdd,
  fileBrowserCredentials,
}: TerminalToolbarProps) {
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);

  // Build network endpoints list, filtering out any without URLs
  const allEndpoints = [
    { domain: sandbox?.publicUrl, port: 3000, protocol: 'HTTPS', label: 'Application' },
    { domain: sandbox?.ttydUrl, port: 7681, protocol: 'HTTPS', label: 'Terminal' },
    {
      domain: sandbox?.fileBrowserUrl,
      port: 8080,
      protocol: 'HTTPS',
      label: 'File Browser',
      hasCredentials: true,
    },
  ];

  // Only show endpoints that have a valid domain URL
  const networkEndpoints = allEndpoints.filter((endpoint) => endpoint.domain);

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
        fileBrowserCredentials={fileBrowserCredentials}
      />
    </>
  );
}
