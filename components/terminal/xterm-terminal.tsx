/**
 * XtermTerminal Component
 *
 * Production-grade terminal component built with xterm.js, supporting WebSocket connection
 * to ttyd backend with comprehensive file upload integration.
 *
 * Core Features:
 * - SSR-safe dynamic module loading for Next.js compatibility
 * - WebSocket auto-reconnection with graceful error handling
 * - Smart scroll behavior with new content indicator
 * - Multiple renderer support (WebGL → Canvas → DOM fallback)
 * - Proper cleanup and memory management on unmount
 *
 * File Upload System:
 * - Drag & drop and paste (Ctrl+V) support
 * - Smart directory detection via terminal session tracking
 * - Uploads to current working directory (not fixed location)
 * - Multi-terminal isolation via container-scoped event listeners
 * - FileBrowser integration with TUS protocol
 * - Security: Only allows uploads within home directory
 * - Toast notifications with absolute path display and filename clipboard copy
 * - Background upload without blocking terminal interaction
 *
 * Authentication & Session Tracking:
 * - ttyd uses HTTP Basic Auth via -c parameter (username:password)
 * - URL format: ?authorization=base64(user:pass)&arg=SESSION_ID
 * - AuthToken sent in WebSocket JSON message for ttyd validation
 * - Session ID passed to ttyd-auth.sh via ?arg= for file upload cwd detection
 * - ttyd-auth.sh stores shell PID in /tmp/.terminal-session-{SESSION_ID}
 * - Backend reads shell PID to detect current working directory via /proc/{PID}/cwd
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ITerminalOptions, Terminal as ITerminal } from '@xterm/xterm';
import { MdArrowDownward } from 'react-icons/md';
import { toast } from 'sonner';

import { useFileDrop } from './hooks/use-file-drop';
import { useFileUpload } from './hooks/use-file-upload';

import '@xterm/xterm/css/xterm.css';

// ============================================================================
// Type Definitions
// ============================================================================

type FitAddon = import('@xterm/addon-fit').FitAddon;
type WebglAddon = import('@xterm/addon-webgl').WebglAddon;
type CanvasAddon = import('@xterm/addon-canvas').CanvasAddon;

enum Command {
  OUTPUT = '0',
  SET_WINDOW_TITLE = '1',
  SET_PREFERENCES = '2',
}

enum ClientCommand {
  INPUT = '0',
  RESIZE_TERMINAL = '1',
  PAUSE = '2',
  RESUME = '3',
}

export interface XtermTerminalProps {
  wsUrl: string;
  sandboxId: string; // Sandbox ID for API calls
  theme?: {
    foreground?: string;
    background?: string;
    cursor?: string;
    black?: string;
    red?: string;
    green?: string;
    yellow?: string;
    blue?: string;
    magenta?: string;
    cyan?: string;
    white?: string;
    brightBlack?: string;
    brightRed?: string;
    brightGreen?: string;
    brightYellow?: string;
    brightBlue?: string;
    brightMagenta?: string;
    brightCyan?: string;
    brightWhite?: string;
  };
  fontSize?: number;
  fontFamily?: string;
  rendererType?: 'dom' | 'canvas' | 'webgl';
  onReady?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  // FileBrowser upload support
  fileBrowserUrl?: string;
  fileBrowserUsername?: string;
  fileBrowserPassword?: string;
  enableFileUpload?: boolean;
  /**
   * Indicates whether this terminal is currently visible in the UI
   *
   * Purpose:
   * - Triggers terminal fit() when visibility changes from hidden to visible
   * - Prevents calling fit() when container has zero dimensions (display: none)
   * - Avoids the known xterm.js FitAddon issue where fitting a hidden terminal results in 1x1 dimensions
   *
   * Why this is needed:
   * - FitAddon cannot auto-detect when a container changes from display:none to display:block
   * - When hidden, container.offsetWidth and container.offsetHeight are 0
   * - Fitting with zero dimensions causes terminal to render incorrectly (1x1 or 80x24 fallback)
   * - requestAnimationFrame ensures fit() is called after browser layout completes
   *
   * Related resources:
   * - GitHub Issue #5320: "wtf why it goes width=1?"
   * - Community pattern: React + xterm.js visibility handling
   * - Default: true
   */
  isVisible?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function XtermTerminal({
  wsUrl,
  sandboxId,
  theme,
  fontSize = 14,
  fontFamily = 'Consolas, Liberation Mono, Menlo, Courier, monospace',
  rendererType = 'webgl',
  onReady,
  onConnected,
  onDisconnected,
  fileBrowserUrl,
  fileBrowserUsername,
  fileBrowserPassword,
  enableFileUpload = true,
  isVisible = true,
}: XtermTerminalProps) {
  // =========================================================================
  // State & Refs
  // =========================================================================

  const fileDropContainerRef = useRef<HTMLDivElement>(null); // Wrapper for file drop events
  const containerRef = useRef<HTMLDivElement>(null); // Xterm.js container
  const terminalRef = useRef<ITerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const hasNewContentRef = useRef(false);
  const newLineCountRef = useRef(0);

  // Cleanup function refs to prevent memory leaks
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const lineFeedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [hasNewContent, setHasNewContent] = useState(false);
  const [newLineCount, setNewLineCount] = useState(0);

  // Terminal session ID for multi-terminal support
  const terminalSessionId = useRef(`terminal-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // =========================================================================
  // File Upload Integration
  // =========================================================================

  // Setup file upload hook
  const { uploadFiles, isUploading, isConfigured } = useFileUpload({
    fileBrowserUrl,
    fileBrowserUsername,
    fileBrowserPassword,
    enabled: enableFileUpload,
  });

  // Handle file drop and paste events
  const handleFilesReceived = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Get current working directory from sandbox
      let targetPath: string | undefined = undefined;
      let absolutePath: string | undefined = undefined;

      try {
        const response = await fetch(
          `/api/sandbox/${sandboxId}/cwd?sessionId=${terminalSessionId.current}`
        );

        if (response.ok) {
          const cwdInfo = await response.json();

          // Check if current directory is within home directory
          if (cwdInfo.isInHome && cwdInfo.cwd && cwdInfo.homeDir) {
            // Convert container absolute path to FileBrowser relative path
            // FileBrowser root (/srv) is mounted to /home/fulling
            // Example: /home/fulling/next/src -> /next/src
            const relativePath = cwdInfo.cwd.startsWith(cwdInfo.homeDir)
              ? cwdInfo.cwd.slice(cwdInfo.homeDir.length) || '/'
              : '/';

            targetPath = relativePath;
            absolutePath = cwdInfo.cwd; // Store absolute path for toast display
          } else if (!cwdInfo.isInHome) {
            toast.warning('Upload to home directory', {
              description: `Current directory (${cwdInfo.cwd}) is outside home. Uploading to home directory instead.`,
              duration: 4000,
            });
            // Will use default path (/) with homeDir as absolute path
            absolutePath = cwdInfo.homeDir;
          }
        } else {
          console.warn('[XtermTerminal] Failed to get cwd, using default upload path');
        }
      } catch (error) {
        console.warn('[XtermTerminal] Failed to get cwd:', error);
        // Continue with default path
      }

      // Upload files - if targetPath is undefined, uploadFiles will use default root path
      try {
        await uploadFiles(files, {
          showToast: true,
          copyToClipboard: true,
          targetPath: targetPath, // undefined = use default root path
          absolutePath: absolutePath, // Absolute container path for toast display
        });
      } catch (error) {
        console.error('[XtermTerminal] Upload failed:', error);
        toast.error('Upload failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
          duration: 5000,
        });
      }
    },
    [uploadFiles, sandboxId]
  );

  // Setup drag and drop / paste event handling
  // Listen on terminal container element instead of window for proper multi-terminal isolation
  useFileDrop({
    enabled: isConfigured && !isUploading,
    onFilesDropped: handleFilesReceived,
    onFilesPasted: handleFilesReceived,
    containerRef: fileDropContainerRef, // Listen on this terminal's container only
  });

  // =========================================================================
  // Memoized Configuration
  // =========================================================================

  const terminalOptions: ITerminalOptions = useMemo(
    () => ({
      fontSize,
      fontFamily,
      theme: theme || {
        foreground: '#d2d2d2',
        background: '#1e1e1e',
        cursor: '#adadad',
        black: '#000000',
        red: '#d81e00',
        green: '#5ea702',
        yellow: '#cfae00',
        blue: '#427ab3',
        magenta: '#89658e',
        cyan: '#00a7aa',
        white: '#dbded8',
        brightBlack: '#686a66',
        brightRed: '#f54235',
        brightGreen: '#99e343',
        brightYellow: '#fdeb61',
        brightBlue: '#84b0d8',
        brightMagenta: '#bc94b7',
        brightCyan: '#37e6e8',
        brightWhite: '#f1f1f0',
      },
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
      scrollback: 10000,
      tabStopWidth: 8,
    }),
    [fontSize, fontFamily, theme]
  );

  // =========================================================================
  // Callbacks
  // =========================================================================

  const handleScrollToBottom = useCallback(() => {
    const terminal = terminalRef.current;
    if (terminal) {
      terminal.scrollToBottom();
    }
    setHasNewContent(false);
    setNewLineCount(0);
  }, []);

  // Wrap callbacks to ensure stability
  const stableOnReady = useCallback(() => {
    onReady?.();
  }, [onReady]);

  const stableOnConnected = useCallback(() => {
    onConnected?.();
  }, [onConnected]);

  const stableOnDisconnected = useCallback(() => {
    onDisconnected?.();
  }, [onDisconnected]);

  // =========================================================================
  // Main Effect - Terminal Lifecycle Management
  // =========================================================================

  useEffect(() => {
    if (!containerRef.current || !wsUrl) return;

    let terminal: ITerminal | null = null;
    let socket: WebSocket | null = null;
    let webglAddon: WebglAddon | null = null;
    let canvasAddon: CanvasAddon | null = null;
    let isMounted = true;
    let isAtBottom = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    // -----------------------------------------------------------------------
    // Helper: Check if at bottom
    // -----------------------------------------------------------------------

    const isTerminalAtBottom = (): boolean => {
      if (!terminal) return true;
      try {
        const buffer = terminal.buffer.active;
        const threshold = 2;
        return buffer.viewportY >= buffer.baseY - threshold;
      } catch {
        return true;
      }
    };

    // -----------------------------------------------------------------------
    // Helper: Parse WebSocket URL and add session ID
    // -----------------------------------------------------------------------

    const parseUrl = (): { wsFullUrl: string; authorization: string } | null => {
      try {
        const url = new URL(wsUrl);
        // Get authorization parameter (base64 encoded credentials for HTTP Basic Auth)
        const authorization = url.searchParams.get('authorization') || '';

        if (!authorization) {
          console.error('[XtermTerminal] No authorization found in URL');
          return null;
        }

        // Add session ID as arg parameter for ttyd-auth.sh
        // URL format: ?authorization=base64(user:pass)&arg=SESSION_ID
        url.searchParams.append('arg', terminalSessionId.current);

        const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsPath = url.pathname.replace(/\/$/, '') + '/ws';
        const wsFullUrl = `${wsProtocol}//${url.host}${wsPath}${url.search}`;

        console.log('[XtermTerminal] Connecting to:', wsFullUrl.replace(authorization, '***'));
        return { wsFullUrl, authorization };
      } catch (error) {
        console.error('[XtermTerminal] Failed to parse URL:', error);
        return null;
      }
    };

    // -----------------------------------------------------------------------
    // Helper: Send data to server
    // -----------------------------------------------------------------------

    const sendData = (data: string | Uint8Array) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      if (typeof data === 'string') {
        // Allocate buffer for UTF-8 encoding: each character may take up to 3 bytes in UTF-8.
        // The extra byte (+1) is for the command code at the start of the buffer.
        const payload = new Uint8Array(data.length * 3 + 1);
        payload[0] = ClientCommand.INPUT.charCodeAt(0);
        const stats = textEncoder.encodeInto(data, payload.subarray(1));
        socket.send(payload.subarray(0, (stats.written as number) + 1));
      } else {
        const payload = new Uint8Array(data.length + 1);
        payload[0] = ClientCommand.INPUT.charCodeAt(0);
        payload.set(data, 1);
        socket.send(payload);
      }
    };

    // -----------------------------------------------------------------------
    // Helper: Apply renderer
    // -----------------------------------------------------------------------

    const applyRenderer = async (type: 'dom' | 'canvas' | 'webgl') => {
      if (!terminal) return;

      // Cleanup existing renderers
      try {
        webglAddon?.dispose();
        webglAddon = null;
      } catch {}
      try {
        canvasAddon?.dispose();
        canvasAddon = null;
      } catch {}

      // Apply new renderer
      switch (type) {
        case 'webgl':
          try {
            const { WebglAddon: WebglAddonClass } = await import('@xterm/addon-webgl');
            webglAddon = new WebglAddonClass();
            terminal.loadAddon(webglAddon);
            console.log('[XtermTerminal] WebGL renderer loaded');
          } catch (e) {
            console.log('[XtermTerminal] WebGL failed, falling back to canvas', e);
            await applyRenderer('canvas');
          }
          break;
        case 'canvas':
          try {
            const { CanvasAddon: CanvasAddonClass } = await import('@xterm/addon-canvas');
            canvasAddon = new CanvasAddonClass();
            terminal.loadAddon(canvasAddon);
            console.log('[XtermTerminal] Canvas renderer loaded');
          } catch (e) {
            console.log('[XtermTerminal] Canvas failed, using DOM', e);
          }
          break;
        case 'dom':
          console.log('[XtermTerminal] DOM renderer loaded');
          break;
      }
    };

    // -----------------------------------------------------------------------
    // Helper: Connect WebSocket
    // -----------------------------------------------------------------------

    const connectWebSocket = () => {
      if (!terminal || !isMounted) return;

      const parsed = parseUrl();
      if (!parsed) {
        stableOnDisconnected();
        return;
      }

      const { wsFullUrl, authorization } = parsed;

      console.log('[XtermTerminal] Creating WebSocket connection...');
      socket = new WebSocket(wsFullUrl, ['tty']);
      socket.binaryType = 'arraybuffer';

      socket.onopen = () => {
        if (!isMounted) return;
        console.log('[XtermTerminal] WebSocket connected');
        stableOnConnected();

        // Send initial terminal size and AuthToken to ttyd
        // AuthToken is required when ttyd is started with -c parameter (HTTP Basic Auth)
        // The value is base64(username:password), same as the authorization URL parameter
        // See: docs/technical-notes/TTYD_AUTHENTICATION.md
        const initMsg = JSON.stringify({
          AuthToken: authorization,
          columns: terminal!.cols,
          rows: terminal!.rows,
        });
        socket?.send(textEncoder.encode(initMsg));

        terminal!.focus();
      };

      socket.onmessage = (event: MessageEvent) => {
        if (!terminal || !isMounted) return;

        const rawData = event.data as ArrayBuffer;
        const cmd = String.fromCharCode(new Uint8Array(rawData)[0]);
        const data = rawData.slice(1);

        switch (cmd) {
          case Command.OUTPUT:
            const shouldAutoScroll = isAtBottom;
            terminal.write(new Uint8Array(data));

            if (shouldAutoScroll) {
              requestAnimationFrame(() => {
                terminal?.scrollToBottom();
                requestAnimationFrame(() => {
                  if (terminal && !isTerminalAtBottom()) {
                    terminal.scrollToBottom();
                  }
                });
              });
            }
            break;
          case Command.SET_WINDOW_TITLE:
            document.title = textDecoder.decode(data);
            break;
          case Command.SET_PREFERENCES:
            console.log('[XtermTerminal] Preferences:', textDecoder.decode(data));
            break;
          default:
            console.warn('[XtermTerminal] Unknown command:', cmd);
        }
      };

      socket.onclose = (event: CloseEvent) => {
        if (!isMounted) return;

        console.log('[XtermTerminal] WebSocket closed:', event.code, event.reason);
        socket = null;
        stableOnDisconnected();

        if (event.code !== 1000) {
          terminal?.write('\r\n\x1b[33m[Connection lost. Reconnecting in 3s...]\x1b[0m\r\n');
          reconnectTimeout = setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, 3000);
        } else {
          terminal?.write('\r\n\x1b[31m[Connection closed]\x1b[0m\r\n');
        }
      };

      socket.onerror = (error) => {
        console.error('[XtermTerminal] WebSocket error:', error);
      };
    };

    // -----------------------------------------------------------------------
    // Main initialization
    // -----------------------------------------------------------------------

    const init = async () => {
      try {
        const [xtermModule, fitAddonModule, webLinksModule] = await Promise.all([
          import('@xterm/xterm'),
          import('@xterm/addon-fit'),
          import('@xterm/addon-web-links'),
        ]);

        if (!isMounted || !containerRef.current) return;

        terminal = new xtermModule.Terminal(terminalOptions);
        terminalRef.current = terminal;

        fitAddonRef.current = new fitAddonModule.FitAddon();
        terminal.loadAddon(fitAddonRef.current);
        terminal.loadAddon(new webLinksModule.WebLinksAddon());

        terminal.open(containerRef.current);

        requestAnimationFrame(() => {
          if (!isMounted) return;
          fitAddonRef.current?.fit();
        });

        requestAnimationFrame(() => {
          if (!isMounted) return;
          applyRenderer(rendererType);
        });

        // Setup event handlers
        terminal.onData((data) => {
          if (!isAtBottom) {
            terminal?.scrollToBottom();
            isAtBottom = true;
          }
          if (hasNewContentRef.current) {
            hasNewContentRef.current = false;
            newLineCountRef.current = 0;
            setHasNewContent(false);
            setNewLineCount(0);
          }
          sendData(data);
        });

        terminal.onBinary((data) => {
          if (!isAtBottom) {
            terminal?.scrollToBottom();
            isAtBottom = true;
          }
          if (hasNewContentRef.current) {
            hasNewContentRef.current = false;
            newLineCountRef.current = 0;
            setHasNewContent(false);
            setNewLineCount(0);
          }
          sendData(Uint8Array.from(data, (v) => v.charCodeAt(0)));
        });

        terminal.onResize(({ cols, rows }) => {
          if (socket?.readyState === WebSocket.OPEN) {
            const msg = JSON.stringify({ columns: cols, rows });
            socket.send(textEncoder.encode(ClientCommand.RESIZE_TERMINAL + msg));
          }
        });

        terminal.onScroll(() => {
          const wasAtBottom = isAtBottom;
          const nowAtBottom = isTerminalAtBottom();

          if (wasAtBottom !== nowAtBottom) {
            isAtBottom = nowAtBottom;
            if (nowAtBottom && hasNewContentRef.current) {
              hasNewContentRef.current = false;
              newLineCountRef.current = 0;
              setHasNewContent(false);
              setNewLineCount(0);
            }
          }
        });

        // Track new line feed events with debounced scroll indicator
        terminal.onLineFeed(() => {
          // Clear previous timeout to debounce rapid line feeds
          if (lineFeedTimeoutRef.current) {
            clearTimeout(lineFeedTimeoutRef.current);
          }

          // Schedule scroll indicator update
          lineFeedTimeoutRef.current = setTimeout(() => {
            if (isAtBottom) {
              terminal?.scrollToBottom();
            } else {
              hasNewContentRef.current = true;
              newLineCountRef.current += 1;
              setHasNewContent(true);
              setNewLineCount(newLineCountRef.current);
            }
          }, 10);
        });

        // Window resize handler: fit terminal when browser window size changes
        const handleResize = () => fitAddonRef.current?.fit();
        window.addEventListener('resize', handleResize);

        // Store cleanup function in ref for later use
        resizeCleanupRef.current = () => {
          window.removeEventListener('resize', handleResize);
        };

        stableOnReady();
        connectWebSocket();

        console.log('[XtermTerminal] Initialization complete');
      } catch (error) {
        console.error('[XtermTerminal] Initialization failed:', error);
      }
    };

    init();

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------

    return () => {
      console.log('[XtermTerminal] Cleaning up');
      isMounted = false;

      // Clean up window resize listener (prevents memory leak)
      if (resizeCleanupRef.current) {
        resizeCleanupRef.current();
        resizeCleanupRef.current = null;
      }

      // Clean up line feed timeout (prevents memory leak)
      if (lineFeedTimeoutRef.current) {
        clearTimeout(lineFeedTimeoutRef.current);
        lineFeedTimeoutRef.current = null;
      }

      if (reconnectTimeout) clearTimeout(reconnectTimeout);

      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.onopen = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'Component unmounted');
        }
      }

      try {
        webglAddon?.dispose();
      } catch {}
      try {
        canvasAddon?.dispose();
      } catch {}

      terminal?.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null; // Clear fitAddonRef on cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]);

  // =========================================================================
  // Handle Visibility Changes - Critical for proper terminal sizing
  // =========================================================================

  /**
   * When isVisible changes (route switch or tab switch), fit the terminal to container
   *
   * Why this is necessary:
   * 1. Problem: FitAddon cannot detect when CSS display changes from 'none' to 'block'
   * 2. When hidden (display: none):
   *    - container.offsetWidth = 0
   *    - container.offsetHeight = 0
   *    - Calling fit() would result in terminal dimensions of 1x1 (xterm.js minimum)
   * 3. When becoming visible:
   *    - React updates CSS to display: block
   *    - Browser performs layout (reflow)
   *    - Container gets actual dimensions (e.g., 1200px × 800px)
   *    - But xterm.js doesn't know about this change
   *
   * Solution:
   * - Watch isVisible prop changes
   * - Only fit() when isVisible becomes true
   * - Use requestAnimationFrame to ensure browser layout is complete before fitting
   *
   * Trigger scenarios:
   * - User navigates from /overview to /terminal → isVisible: false → true
   * - User switches terminal tabs → active tab isVisible: false → true
   * - User navigates away from /terminal → isVisible: true → false (no fit needed)
   *
   * Related: This complements window.resize handler which handles browser window size changes
   */
  useEffect(() => {
    if (isVisible && terminalRef.current && containerRef.current) {
      // Use requestAnimationFrame to ensure container has completed layout
      // and has actual dimensions before calling fit()
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
    }
  }, [isVisible]);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div ref={fileDropContainerRef} className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ padding: '5px' }} />

      {/* Scroll to bottom button */}
      {hasNewContent && (
        <button
          onClick={handleScrollToBottom}
          className="absolute bottom-5 right-6 z-10
                     flex items-center gap-2 px-3 py-1.5
                     bg-[#252526] hover:bg-[#2d2d2d]
                     text-[#cccccc] hover:text-white
                     border border-[#454545]
                     shadow-2xl rounded-[3px]
                     transition-all duration-200
                     text-xs font-normal
                     animate-fade-in"
          aria-label={`Scroll to bottom (${newLineCount} new lines)`}
        >
          <MdArrowDownward className="w-3.5 h-3.5 text-[#3794ff]" />
          <span className="font-mono text-[#3794ff] font-medium">{newLineCount}</span>
          <span>new {newLineCount === 1 ? 'line' : 'lines'}</span>
        </button>
      )}
    </div>
  );
}
