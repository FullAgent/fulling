/**
 * ttyd Command Execution Utility
 *
 * Provides a programmatic way to execute commands via ttyd WebSocket connection
 * and retrieve the output. Works in both browser and Node.js environments.
 *
 * Environment Support:
 * - Browser: Uses native WebSocket API
 * - Node.js: Dynamically imports 'ws' package (must be installed: pnpm add ws)
 *
 * Protocol:
 * - ttyd uses a binary WebSocket protocol with command prefixes
 * - Server commands: '0' = OUTPUT, '1' = SET_WINDOW_TITLE, '2' = SET_PREFERENCES
 * - Client commands: '0' = INPUT, '1' = RESIZE_TERMINAL
 *
 * Usage:
 * ```typescript
 * const result = await executeTtydCommand({
 *   ttydUrl: 'https://terminal.example.com',
 *   accessToken: 'your-token',
 *   command: 'ls -la',
 * })
 * console.log(result.output)
 * ```
 */

import { generateRandomString } from './common'

// ============================================================================
// Environment Detection & WebSocket Abstraction
// ============================================================================

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined'
}

/**
 * Unified WebSocket interface for both environments
 */
interface UnifiedWebSocket {
  readonly readyState: number
  binaryType: string
  send(data: ArrayBuffer | Uint8Array): void
  close(code?: number, reason?: string): void
  onOpen(listener: () => void): void
  onMessage(listener: (data: ArrayBuffer) => void): void
  onError(listener: (message: string) => void): void
  onClose(listener: (code: number, reason: string) => void): void
}

const WS_OPEN = 1 // WebSocket.OPEN constant

// ============================================================================
// Constants
// ============================================================================

/** Server-to-client command codes */
enum ServerCommand {
  OUTPUT = '0',
  SET_WINDOW_TITLE = '1',
  SET_PREFERENCES = '2',
}

/** Client-to-server command codes */
enum ClientCommand {
  INPUT = '0',
  RESIZE_TERMINAL = '1',
}

/** Default terminal dimensions */
const DEFAULT_COLS = 120
const DEFAULT_ROWS = 30

/** Default timeout in milliseconds (30 seconds) */
const DEFAULT_TIMEOUT_MS = 30000

/** End marker prefix for detecting command completion */
const END_MARKER_PREFIX = '___TTYD_EXEC_END___'

// ============================================================================
// Types
// ============================================================================

export interface TtydExecOptions {
  /** ttyd server URL (e.g., 'https://terminal.example.com') */
  ttydUrl: string

  /** Access token for ttyd authentication */
  accessToken: string

  /** Command or script to execute */
  command: string

  /** Optional session ID for multi-terminal support */
  sessionId?: string

  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number

  /** Terminal columns (default: 120) */
  cols?: number

  /** Terminal rows (default: 30) */
  rows?: number

  /** Whether to strip ANSI escape codes from output (default: true) */
  stripAnsi?: boolean
}

export interface TtydExecResult {
  /** Command execution output */
  output: string

  /** Exit code (extracted from marker, -1 if not available) */
  exitCode: number

  /** Whether the command timed out */
  timedOut: boolean

  /** Execution duration in milliseconds */
  durationMs: number
}

export class TtydExecError extends Error {
  constructor(
    message: string,
    public readonly code: TtydExecErrorCode,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'TtydExecError'
  }
}

export enum TtydExecErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TIMEOUT = 'TIMEOUT',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Strip ANSI escape codes from string
 */
function stripAnsiCodes(str: string): string {
   
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
}

/**
 * Build WebSocket URL from ttyd HTTP URL
 */
function buildWsUrl(ttydUrl: string, accessToken: string, sessionId?: string): string {
  const url = new URL(ttydUrl)
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsPath = url.pathname.replace(/\/$/, '') + '/ws'

  // Build query string with token and optional session ID
  const params = new URLSearchParams()
  params.append('arg', accessToken)
  if (sessionId) {
    params.append('arg', sessionId)
  }

  return `${wsProtocol}//${url.host}${wsPath}?${params.toString()}`
}

/**
 * Wrap command with exit code capture and end marker
 *
 * The wrapped command:
 * 1. Executes the original command
 * 2. Captures the exit code
 * 3. Outputs a unique end marker with the exit code
 *
 * This allows us to detect when the command has finished and extract the exit code.
 */
function wrapCommand(command: string, markerId: string): string {
  // Use a subshell to capture exit code without affecting the environment
  // The marker format: ___TTYD_EXEC_END___<markerId>:<exitCode>___
  return `(${command}); echo "${END_MARKER_PREFIX}${markerId}:$?___"`
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Execute a command via ttyd WebSocket connection
 *
 * @param options - Execution options
 * @returns Execution result with output and exit code
 * @throws TtydExecError on connection, authentication, or timeout errors
 *
 * @example
 * ```typescript
 * // Simple command
 * const result = await executeTtydCommand({
 *   ttydUrl: 'https://terminal.example.com',
 *   accessToken: 'token123',
 *   command: 'echo "Hello World"',
 * })
 * console.log(result.output) // "Hello World\n"
 * console.log(result.exitCode) // 0
 *
 * // Multi-line script
 * const result = await executeTtydCommand({
 *   ttydUrl: 'https://terminal.example.com',
 *   accessToken: 'token123',
 *   command: `
 *     cd /app
 *     npm install
 *     npm run build
 *   `,
 *   timeoutMs: 120000, // 2 minutes
 * })
 * ```
 */
export async function executeTtydCommand(options: TtydExecOptions): Promise<TtydExecResult> {
  const {
    ttydUrl,
    accessToken,
    command,
    sessionId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cols = DEFAULT_COLS,
    rows = DEFAULT_ROWS,
    stripAnsi = true,
  } = options

  const startTime = Date.now()
  const markerId = generateRandomString(8)
  const endMarkerPattern = new RegExp(`${END_MARKER_PREFIX}${markerId}:(\\d+)___`)

  // Build WebSocket URL
  const wsUrl = buildWsUrl(ttydUrl, accessToken, sessionId)

  // Text encoder/decoder
  const textEncoder = new TextEncoder()
  const textDecoder = new TextDecoder()

  return new Promise((resolve, reject) => {
    let outputBuffer = ''
    let isResolved = false
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    let ws: UnifiedWebSocket | null = null

    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
        timeoutHandle = null
      }
      if (ws) {
        try {
          ws.close(1000, 'Command completed')
        } catch {
          // Ignore close errors
        }
        ws = null
      }
    }

    const resolveWith = (result: TtydExecResult) => {
      if (isResolved) return
      isResolved = true
      cleanup()
      resolve(result)
    }

    const rejectWith = (error: TtydExecError) => {
      if (isResolved) return
      isResolved = true
      cleanup()
      reject(error)
    }

    // Setup timeout
    timeoutHandle = setTimeout(() => {
      resolveWith({
        output: stripAnsi ? stripAnsiCodes(outputBuffer) : outputBuffer,
        exitCode: -1,
        timedOut: true,
        durationMs: Date.now() - startTime,
      })
    }, timeoutMs)

    // Create WebSocket connection based on environment
    const createWebSocket = async (): Promise<UnifiedWebSocket> => {
      if (isBrowser()) {
        // Browser environment - use native WebSocket
        const browserWs = new window.WebSocket(wsUrl, ['tty'])
        browserWs.binaryType = 'arraybuffer'

        return {
          get readyState() {
            return browserWs.readyState
          },
          get binaryType() {
            return browserWs.binaryType
          },
          set binaryType(value: string) {
            browserWs.binaryType = value as BinaryType
          },
          send: (data: ArrayBuffer | Uint8Array) => browserWs.send(data),
          close: (code?: number, reason?: string) => browserWs.close(code, reason),
          onOpen: (listener: () => void) => {
            browserWs.onopen = listener
          },
          onMessage: (listener: (data: ArrayBuffer) => void) => {
            browserWs.onmessage = (event: MessageEvent) => listener(event.data as ArrayBuffer)
          },
          onError: (listener: (message: string) => void) => {
            browserWs.onerror = () => listener('WebSocket error')
          },
          onClose: (listener: (code: number, reason: string) => void) => {
            browserWs.onclose = (event: CloseEvent) => listener(event.code, event.reason)
          },
        }
      } else {
        // Node.js environment - dynamically import 'ws' package
        try {
          const wsModule = await import('ws')
          const WsClass = wsModule.default
          const nodeWs = new WsClass(wsUrl, ['tty'], {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          })
          nodeWs.binaryType = 'arraybuffer'

          return {
            get readyState() {
              return nodeWs.readyState
            },
            get binaryType() {
              return nodeWs.binaryType
            },
            set binaryType(value: string) {
              nodeWs.binaryType = value as 'arraybuffer' | 'nodebuffer' | 'fragments'
            },
            send: (data: ArrayBuffer | Uint8Array) => nodeWs.send(data),
            close: (code?: number, reason?: string) => nodeWs.close(code, reason),
            onOpen: (listener: () => void) => {
              nodeWs.on('open', listener)
            },
            onMessage: (listener: (data: ArrayBuffer) => void) => {
              nodeWs.on('message', (data: Buffer | ArrayBuffer) => {
                // Convert Buffer to ArrayBuffer for consistency
                if (data instanceof ArrayBuffer) {
                  listener(data)
                } else {
                  // Create a new ArrayBuffer from Buffer to avoid SharedArrayBuffer issues
                  const arrayBuffer = new ArrayBuffer(data.byteLength)
                  new Uint8Array(arrayBuffer).set(new Uint8Array(data))
                  listener(arrayBuffer)
                }
              })
            },
            onError: (listener: (message: string) => void) => {
              nodeWs.on('error', (error: Error) => listener(error.message))
            },
            onClose: (listener: (code: number, reason: string) => void) => {
              nodeWs.on('close', (code: number, reason: Buffer) => {
                listener(code, reason.toString())
              })
            },
          }
        } catch (error) {
          throw new TtydExecError(
            'Failed to load ws package. Install it with: pnpm add ws',
            TtydExecErrorCode.CONNECTION_FAILED,
            error instanceof Error ? error : undefined
          )
        }
      }
    }

    // Initialize WebSocket connection
    createWebSocket()
      .then((socket) => {
        ws = socket

        // Handle open event
        ws.onOpen(() => {
          if (!ws) return

          // Send initial terminal size
          const initMsg = JSON.stringify({ columns: cols, rows: rows })
          ws.send(textEncoder.encode(initMsg))

          // Wait a bit for shell to initialize, then send command
          setTimeout(() => {
            if (!ws || ws.readyState !== WS_OPEN) return

            // Send the wrapped command
            const wrappedCommand = wrapCommand(command, markerId)
            const inputPayload = new Uint8Array(wrappedCommand.length * 3 + 1)
            inputPayload[0] = ClientCommand.INPUT.charCodeAt(0)
            const stats = textEncoder.encodeInto(wrappedCommand, inputPayload.subarray(1))
            ws.send(inputPayload.subarray(0, (stats.written as number) + 1))

            // Send Enter key
            const enterPayload = new Uint8Array(2)
            enterPayload[0] = ClientCommand.INPUT.charCodeAt(0)
            enterPayload[1] = 0x0d // Carriage return
            ws.send(enterPayload)
          }, 100)
        })

        // Handle message event
        ws.onMessage((rawData: ArrayBuffer) => {
          const bytes = new Uint8Array(rawData)

          if (bytes.length === 0) return

          const cmd = String.fromCharCode(bytes[0])
          const payload = rawData.slice(1)

          if (cmd === ServerCommand.OUTPUT) {
            const text = textDecoder.decode(payload)
            outputBuffer += text

            // Check for end marker
            const match = outputBuffer.match(endMarkerPattern)
            if (match) {
              const exitCode = parseInt(match[1], 10)

              // Extract output before the marker (and remove the command echo)
              let cleanOutput = outputBuffer.substring(0, match.index)

              // Remove the echoed command from the beginning (first line after prompt)
              const lines = cleanOutput.split('\n')
              // Find and remove the line containing our wrapped command
              const commandLineIndex = lines.findIndex(
                (line) => line.includes(END_MARKER_PREFIX) && line.includes(markerId)
              )
              if (commandLineIndex !== -1) {
                lines.splice(commandLineIndex, 1)
              }
              cleanOutput = lines.join('\n')

              // Also remove the marker echo line from the end
              cleanOutput = cleanOutput.replace(
                new RegExp(`.*${END_MARKER_PREFIX}${markerId}.*\n?`),
                ''
              )

              resolveWith({
                output: stripAnsi ? stripAnsiCodes(cleanOutput).trim() : cleanOutput.trim(),
                exitCode,
                timedOut: false,
                durationMs: Date.now() - startTime,
              })
            }
          }
        })

        // Handle error event
        ws.onError((message: string) => {
          rejectWith(
            new TtydExecError(
              `WebSocket error: ${message}`,
              TtydExecErrorCode.WEBSOCKET_ERROR
            )
          )
        })

        // Handle close event
        ws.onClose((code: number, reason: string) => {
          if (isResolved) return

          // Check for authentication failure
          if (code === 1008 || reason?.includes('auth')) {
            rejectWith(
              new TtydExecError(
                `Authentication failed: ${reason}`,
                TtydExecErrorCode.AUTHENTICATION_FAILED
              )
            )
            return
          }

          // Connection closed before command completed
          rejectWith(
            new TtydExecError(
              `Connection closed unexpectedly: code=${code}, reason=${reason}`,
              TtydExecErrorCode.CONNECTION_FAILED
            )
          )
        })
      })
      .catch((error) => {
        rejectWith(
          error instanceof TtydExecError
            ? error
            : new TtydExecError(
                `Failed to create WebSocket connection: ${error}`,
                TtydExecErrorCode.CONNECTION_FAILED,
                error instanceof Error ? error : undefined
              )
        )
      })
  })
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Execute a simple command and return just the output string
 *
 * @param ttydUrl - ttyd server URL
 * @param accessToken - Access token for authentication
 * @param command - Command to execute
 * @returns Command output as string
 * @throws TtydExecError on failure
 */
export async function execCommand(
  ttydUrl: string,
  accessToken: string,
  command: string
): Promise<string> {
  const result = await executeTtydCommand({
    ttydUrl,
    accessToken,
    command,
  })

  if (result.timedOut) {
    throw new TtydExecError('Command timed out', TtydExecErrorCode.TIMEOUT)
  }

  return result.output
}

/**
 * Execute a command and check if it succeeded (exit code 0)
 *
 * @param ttydUrl - ttyd server URL
 * @param accessToken - Access token for authentication
 * @param command - Command to execute
 * @returns True if command succeeded (exit code 0)
 */
export async function execCommandSuccess(
  ttydUrl: string,
  accessToken: string,
  command: string
): Promise<boolean> {
  try {
    const result = await executeTtydCommand({
      ttydUrl,
      accessToken,
      command,
    })
    return result.exitCode === 0 && !result.timedOut
  } catch {
    return false
  }
}