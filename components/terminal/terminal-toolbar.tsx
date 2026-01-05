/**
 * TerminalToolbar Component
 *
 * Toolbar for terminal with tabs, status, and operation controls
 */

'use client';

import { useEffect, useState } from 'react';
import type { Prisma } from '@prisma/client';
import { Copy, Eye, EyeOff, Loader2, Network, Play, Plus, Square, Terminal as TerminalIcon, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Project = Prisma.ProjectGetPayload<{
  include: {
    sandboxes: true;
    databases: true;
  };
}>;

type Sandbox = Prisma.SandboxGetPayload<object>;

export interface Tab {
  id: string;
  name: string;
}

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
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isStartingApp, setIsStartingApp] = useState(false);
  const [isStoppingApp, setIsStoppingApp] = useState(false);
  const [isAppRunning, setIsAppRunning] = useState(false);

  // Check app status on mount
  useEffect(() => {
    if (!sandbox?.id) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/sandbox/${sandbox.id}/app-status`);
        const data = await response.json();
        setIsAppRunning(data.running);
      } catch (error) {
        console.error('Failed to check app status:', error);
      }
    };

    checkStatus();
  }, [sandbox?.id]);

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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Start application in background
  const handleStartApp = async () => {
    if (!sandbox?.id || isStartingApp) return;

    setIsStartingApp(true);
    setShowStartConfirm(false); // Close modal

    // Send exec command (fire and forget, don't wait for response)
    fetch(`/api/sandbox/${sandbox.id}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'pnpm run build && pnpm run start',
        workdir: '/home/fulling/next',
      }),
    }).catch(() => {
      // Ignore errors, we'll detect success via port polling
    });

    toast.info('Starting...', {
      description: 'Building and starting your app. This may take a few minutes.',
    });

    // Poll for app status every 10 seconds, max 5 minutes
    const maxAttempts = 30; // 30 * 10s = 5 minutes
    let attempts = 0;

    const pollStatus = async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/sandbox/${sandbox.id}/app-status`);
        const data = await response.json();
        return data.running;
      } catch {
        return false;
      }
    };

    const poll = async () => {
      while (attempts < maxAttempts) {
        attempts++;
        const running = await pollStatus();
        if (running) {
          setIsAppRunning(true);
          setIsStartingApp(false);
          toast.success('App Running', {
            description: 'Your app is live in the background',
          });
          return;
        }
        // Wait 10 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      // Timeout after max attempts
      setIsStartingApp(false);
      toast.error('Start Timeout', {
        description: 'App did not start within 5 minutes. Check terminal for errors.',
      });
    };

    poll();
  };

  // Stop application
  const handleStopApp = async () => {
    if (!sandbox?.id || isStoppingApp) return;

    setIsStoppingApp(true);
    try {
      const response = await fetch(`/api/sandbox/${sandbox.id}/app-status`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setIsAppRunning(false);
        toast.success('App Stopped');
      } else {
        toast.error('Stop Failed', {
          description: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Failed to stop app:', error);
      toast.error('Stop Failed', {
        description: 'Network error, please try again',
      });
    } finally {
      setIsStoppingApp(false);
    }
  };

  // Toggle app start/stop
  const handleToggleApp = () => {
    if (isAppRunning) {
      handleStopApp();
    } else {
      setShowStartConfirm(true); // Open confirmation modal
    }
  };

  return (
    <>
      <div className="h-12 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between">
        {/* Terminal Tabs */}
        <div className="flex items-center flex-1 min-w-0 h-full overflow-x-auto overflow-y-hidden">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'flex items-center gap-2 px-4 h-full text-xs cursor-pointer transition-colors border-r border-[#3e3e42] relative group min-w-[120px] max-w-[200px]',
                activeTabId === tab.id
                  ? 'bg-[#1e1e1e] text-white'
                  : 'bg-[#2d2d30] text-[#969696] hover:bg-[#2d2d30] hover:text-white'
              )}
              onClick={() => onTabSelect(tab.id)}
            >
              {/* Top Accent Line for Active Tab */}
              {activeTabId === tab.id && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#007fd4]" />
              )}
              
              <TerminalIcon className={cn("h-3.5 w-3.5 shrink-0", activeTabId === tab.id ? "text-white" : "text-[#007fd4]")} />
              <span className="truncate flex-1">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={cn(
                    "p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-all",
                    activeTabId === tab.id ? "hover:bg-[#37373d]" : "hover:bg-[#454549]"
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={onTabAdd}
            className="h-full aspect-square flex items-center justify-center text-[#c5c5c5] hover:bg-[#37373d] transition-colors border-r border-transparent"
            title="Add new terminal"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {/* <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300">
            <div className={cn('h-1.5 w-1.5 rounded-full', getStatusBgClasses(project.status))} />
            <span>{project.status}</span>
          </div> */}

          {/* Run App Button (was Deploy) */}
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

          {/* Network Button */}
          <button
            onClick={() => setShowNetworkDialog(true)}
            className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-[#37373d] rounded transition-colors flex items-center gap-1"
            title="View network endpoints"
          >
            <Network className="h-3 w-3" />
            <span>Network</span>
          </button>
        </div>
      </div>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
        <AlertDialogContent className="bg-[#252526] border-[#3e3e42] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Run Application & Keep Active?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 space-y-3">
              <p>
                This will build and start your application by running:
                <br />
                <code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded text-xs border border-[#3e3e42] mt-1 inline-block font-mono text-blue-400">pnpm build && pnpm start</code>
              </p>
              
              <div className="bg-[#1e1e1e]/50 rounded-md border border-[#3e3e42]/50 text-sm">
                <div className="p-3 space-y-2">
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>App runs continuously in the background</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Remains active even if you leave this page</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Can be stopped anytime by clicking this button again</span>
                  </div>
                </div>

                {sandbox?.publicUrl && (
                  <div className="px-3 pb-3 pt-2 border-t border-[#3e3e42]/30">
                    <div className="text-xs text-gray-500 mb-1">Once running, your application will be available at:</div>
                    <a 
                      href={sandbox.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-[#3794ff] hover:text-[#4fc1ff] break-all underline underline-offset-2 hover:underline-offset-4 transition-all block"
                    >
                      {sandbox.publicUrl}
                    </a>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#3e3e42] text-gray-300 hover:bg-[#37373d] hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartApp} className="bg-[#007fd4] hover:bg-[#0060a0] text-white">
              Confirm & Run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Network Dialog */}
      <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
        <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Network Endpoints</DialogTitle>
            <DialogDescription className="text-gray-400 mt-1">
              All publicly accessible endpoints for this sandbox
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 mt-5">
            {networkEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="p-3.5 bg-[#1e1e1e] rounded-lg border border-[#3e3e42] hover:border-[#4e4e52] transition-colors"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-white">Port {endpoint.port}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#252526] text-[#858585] border border-[#3e3e42]">
                      {endpoint.label}
                    </span>
                  </div>
                  <span className="text-xs text-[#858585] font-mono">{endpoint.protocol}</span>
                </div>
                <a
                  href={endpoint.domain || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#3794ff] hover:text-[#4fc1ff] break-all underline underline-offset-2 hover:underline-offset-4 transition-all"
                >
                  {endpoint.domain}
                </a>

                {/* Show credentials for File Browser */}
                {endpoint.hasCredentials && fileBrowserCredentials && (
                  <div className="mt-3 pt-3 border-t border-[#3e3e42] space-y-2">
                    <div className="text-xs text-gray-400 mb-1.5">Login Credentials:</div>

                    {/* Username */}
                    <div className="flex items-center gap-2 bg-[#252526] rounded p-2 border border-[#3e3e42]">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-500 mb-0.5">Username</div>
                        <code className="text-xs text-blue-400 break-all">
                          {fileBrowserCredentials.username}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(fileBrowserCredentials.username, 'username')}
                        className="p-1.5 hover:bg-[#37373d] rounded transition-colors shrink-0"
                        title="Copy username"
                      >
                        {copiedField === 'username' ? (
                          <span className="text-xs text-green-400">✓</span>
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Password */}
                    <div className="flex items-center gap-2 bg-[#252526] rounded p-2 border border-[#3e3e42]">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-500 mb-0.5">Password</div>
                        <code className="text-xs text-blue-400 break-all">
                          {showPassword ? fileBrowserCredentials.password : '••••••••••••••••'}
                        </code>
                      </div>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 hover:bg-[#37373d] rounded transition-colors shrink-0"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(fileBrowserCredentials.password, 'password')}
                        className="p-1.5 hover:bg-[#37373d] rounded transition-colors shrink-0"
                        title="Copy password"
                      >
                        {copiedField === 'password' ? (
                          <span className="text-xs text-green-400">✓</span>
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
