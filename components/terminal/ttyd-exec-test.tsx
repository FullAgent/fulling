'use client'

/**
 * TtydExecTest Component
 *
 * A simple test component to verify the ttyd-exec utility works in the browser.
 * This component provides a UI to execute commands via ttyd WebSocket and display results.
 *
 * Usage:
 * ```tsx
 * <TtydExecTest
 *   ttydUrl="https://terminal.example.com"
 *   accessToken="your-token"
 * />
 * ```
 */

import { useCallback, useState } from 'react'

import { executeTtydCommand, TtydExecError, TtydExecResult } from '@/lib/util/ttyd-exec'

interface TtydExecTestProps {
  /** ttyd server URL (e.g., 'https://terminal.example.com') */
  ttydUrl: string
  /** Access token for ttyd authentication */
  accessToken: string
}

export function TtydExecTest({ ttydUrl, accessToken }: TtydExecTestProps) {
  const [command, setCommand] = useState('echo "Hello from ttyd-exec!"')
  const [result, setResult] = useState<TtydExecResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleExecute = useCallback(async () => {
    if (!command.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('[TtydExecTest] Executing command:', command)
      console.log('[TtydExecTest] URL:', ttydUrl)

      const execResult = await executeTtydCommand({
        ttydUrl,
        accessToken,
        command,
        timeoutMs: 30000,
        stripAnsi: true,
      })

      console.log('[TtydExecTest] Result:', execResult)
      setResult(execResult)
    } catch (err) {
      console.error('[TtydExecTest] Error:', err)
      if (err instanceof TtydExecError) {
        setError(`${err.code}: ${err.message}`)
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      setIsLoading(false)
    }
  }, [command, ttydUrl, accessToken])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleExecute()
      }
    },
    [handleExecute]
  )

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">ttyd-exec Test</h2>

      {/* Command Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Command:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command to execute..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleExecute}
            disabled={isLoading || !command.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium text-sm transition-colors"
          >
            {isLoading ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Quick commands:</label>
        <div className="flex flex-wrap gap-2">
          {[
            'echo "Hello World"',
            'pwd',
            'ls -la',
            'whoami',
            'date',
            'node --version',
            'cat /etc/os-release | head -3',
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => setCommand(cmd)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-mono transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded">
          <div className="text-red-400 text-sm font-medium">Error:</div>
          <div className="text-red-300 text-sm font-mono">{error}</div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-3">
          {/* Metadata */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-gray-800 rounded">
              <div className="text-gray-400">Exit Code</div>
              <div
                className={`font-mono font-semibold ${result.exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {result.exitCode}
              </div>
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <div className="text-gray-400">Duration</div>
              <div className="font-mono">{result.durationMs}ms</div>
            </div>
            <div className="p-2 bg-gray-800 rounded">
              <div className="text-gray-400">Timed Out</div>
              <div className={`font-mono ${result.timedOut ? 'text-yellow-400' : 'text-gray-300'}`}>
                {result.timedOut ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {/* Output */}
          <div>
            <div className="text-sm text-gray-400 mb-1">Output:</div>
            <pre className="p-3 bg-gray-800 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
              {result.output || '(empty output)'}
            </pre>
          </div>
        </div>
      )}

      {/* Connection Info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          <div>
            URL: <span className="font-mono">{ttydUrl}</span>
          </div>
          <div>
            Token: <span className="font-mono">{accessToken.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  )
}