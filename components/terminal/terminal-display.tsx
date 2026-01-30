/**
 * TerminalDisplay Component
 *
 * Wrapper component for XtermTerminal that manages connection states and loading UI.
 * Displays appropriate status messages when terminal is not ready or sandbox is not running.
 *
 * Features:
 * - Loading overlays during initialization and connection
 * - Status-based conditional rendering
 * - Connection status indicators
 * - Automatic reconnection feedback
 */

'use client';

import { useCallback, useState } from 'react';
import { MdErrorOutline, MdTerminal } from 'react-icons/md';

import { Spinner } from '@/components/ui/spinner';
import {
  getStatusIconColor,
  getStatusMessage,
  isErrorStatus,
  shouldShowSpinner,
} from '@/lib/util/status-colors';
import { cn } from '@/lib/utils';

import { XtermTerminal } from './xterm-terminal';

// ============================================================================
// Types
// ============================================================================

export interface TerminalDisplayProps {
  sandboxId: string;
  ttydUrl?: string | null;
  status: string;
  tabId: string;
  fileBrowserUrl?: string | null;
  fileBrowserUsername?: string;
  fileBrowserPassword?: string;
  /**
   * Indicates whether this terminal instance is currently visible to the user
   * - Controls when to trigger terminal resize/fit operations
   * - Prevents incorrect dimension calculations when container is hidden (display: none)
   * - Passed down from TerminalContainer which combines route visibility and active tab state
   * - Default: true
   */
  isVisible?: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'error';

// ============================================================================
// Component
// ============================================================================

export function TerminalDisplay({
  sandboxId,
  ttydUrl,
  status,
  tabId,
  fileBrowserUrl,
  fileBrowserUsername,
  fileBrowserPassword,
  isVisible = true,
}: TerminalDisplayProps) {
  // =========================================================================
  // State Management
  // =========================================================================

  const [terminalReady, setTerminalReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // =========================================================================
  // Event Handlers
  // =========================================================================

  const handleReady = useCallback(() => {
    console.log('[TerminalDisplay] Terminal initialized successfully');
    setTerminalReady(true);
  }, []);

  const handleConnected = useCallback(() => {
    console.log('[TerminalDisplay] WebSocket connection established');
    setConnectionStatus('connected');
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('[TerminalDisplay] WebSocket connection closed');
    setConnectionStatus('connecting');
  }, []);

  // =========================================================================
  // Conditional Rendering Logic
  // =========================================================================

  // Only render terminal when sandbox is running and ttyd URL is available
  if (status === 'RUNNING' && ttydUrl) {
    const isLoading = connectionStatus === 'connecting' || !terminalReady;
    const showReconnectIndicator = connectionStatus === 'connecting' && terminalReady;
    const showErrorIndicator = connectionStatus === 'error' && terminalReady;

    return (
      <div className="h-full w-full bg-background flex flex-col relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
            <div className="flex items-center gap-3">
              <Spinner className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                {!terminalReady ? 'Initializing terminal...' : 'Establishing connection...'}
              </span>
            </div>
          </div>
        )}

        {/* Terminal Instance */}
        <div className="flex-1 w-full p-2">
          {/*
            Pass visibility state to XtermTerminal
            - XtermTerminal will use this to decide when to call fit()
            - Avoids fitting terminal when container dimensions are 0 (display: none)
          */}
          <XtermTerminal
            key={`xterm-${tabId}`}
            wsUrl={ttydUrl}
            sandboxId={sandboxId}
            theme={{
              foreground: '#fafafa',
              background: '#09090b',
              cursor: '#fafafa',
              black: '#09090b',
              red: '#ef4444',
              green: '#22c55e',
              yellow: '#eab308',
              blue: '#3b82f6',
              magenta: '#a855f7',
              cyan: '#06b6d4',
              white: '#fafafa',
              brightBlack: '#71717a',
              brightRed: '#f87171',
              brightGreen: '#4ade80',
              brightYellow: '#facc15',
              brightBlue: '#60a5fa',
              brightMagenta: '#c084fc',
              brightCyan: '#22d3ee',
              brightWhite: '#ffffff',
            }}
            fontSize={14}
            fontFamily="Consolas, Liberation Mono, Menlo, Courier, monospace"
            rendererType="webgl"
            onReady={handleReady}
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
            fileBrowserUrl={fileBrowserUrl || undefined}
            fileBrowserUsername={fileBrowserUsername}
            fileBrowserPassword={fileBrowserPassword}
            enableFileUpload={true}
            isVisible={isVisible}
          />
        </div>

        {/* Connection Status Indicators */}
        {showReconnectIndicator && (
          <div className="absolute top-2 right-2 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1 flex items-center gap-2">
            <Spinner className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-yellow-500">Reconnecting...</span>
          </div>
        )}

        {showErrorIndicator && (
          <div className="absolute top-2 right-2 bg-red-500/10 border border-red-500/30 rounded px-2 py-1 flex items-center gap-2">
            <MdErrorOutline className="h-3 w-3 text-red-500" />
            <span className="text-xs text-red-500">Connection failed</span>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // Status Message Display
  // =========================================================================

  // Show appropriate status message when terminal is not available
  const StatusIcon = shouldShowSpinner(status)
    ? Spinner
    : isErrorStatus(status)
      ? MdErrorOutline
      : MdTerminal;

  return (
    <div className="h-full w-full bg-background flex items-center justify-center">
      <div className="flex items-center gap-3">
        <StatusIcon className={cn('h-5 w-5', getStatusIconColor(status))} />
        <span className="text-sm text-muted-foreground">{getStatusMessage(status)}</span>
      </div>
    </div>
  );
}