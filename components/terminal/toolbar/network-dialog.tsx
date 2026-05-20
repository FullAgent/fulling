'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdClose, MdContentCopy, MdVisibility, MdVisibilityOff } from 'react-icons/md';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { NetworkEndpoint } from './network-endpoints';

// ============================================================================
// Types
// ============================================================================

interface ExposedPort {
  port: number;
  url: string;
}

export interface NetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoints: NetworkEndpoint[];
  sandboxId?: string;
}

// ============================================================================
// Component
// ============================================================================

export function NetworkDialog({
  open,
  onOpenChange,
  endpoints,
  sandboxId,
}: NetworkDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [portInput, setPortInput] = useState('');
  const [exposedPorts, setExposedPorts] = useState<ExposedPort[]>([]);
  const [isExposing, setIsExposing] = useState(false);
  const [portError, setPortError] = useState<string | null>(null);

  const fetchExposedPorts = useCallback(async () => {
    if (!sandboxId) return;
    try {
      const res = await fetch(`/api/sandbox/${sandboxId}/ports`);
      if (res.ok) {
        const data = await res.json();
        setExposedPorts(data.ports || []);
      }
    } catch {
      // silently fail
    }
  }, [sandboxId]);

  useEffect(() => {
    if (open && sandboxId) {
      fetchExposedPorts();
    }
  }, [open, sandboxId, fetchExposedPorts]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExposePort = async () => {
    const port = parseInt(portInput, 10);
    if (!port || port < 1 || port > 65535) {
      setPortError('Enter a valid port (1-65535)');
      return;
    }

    if ([3000, 3773, 7681, 8080].includes(port)) {
      setPortError('This is a built-in port');
      return;
    }

    if (exposedPorts.some((p) => p.port === port)) {
      setPortError('Port already exposed');
      return;
    }

    setPortError(null);
    setIsExposing(true);

    try {
      const res = await fetch(`/api/sandbox/${sandboxId}/ports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPortError(data.error || 'Failed to expose port');
        return;
      }

      const data = await res.json();
      setExposedPorts((prev) => [...prev, { port: data.port, url: data.url }]);
      setPortInput('');
    } catch {
      setPortError('Network error');
    } finally {
      setIsExposing(false);
    }
  };

  const handleUnexposePort = async (port: number) => {
    try {
      const res = await fetch(`/api/sandbox/${sandboxId}/ports`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port }),
      });

      if (res.ok) {
        setExposedPorts((prev) => prev.filter((p) => p.port !== port));
      }
    } catch {
      // silently fail
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Network Endpoints</DialogTitle>
          <DialogDescription className="text-gray-400 mt-1">
            All publicly accessible endpoints for this sandbox
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 mt-5">
          {/* Built-in endpoints */}
          {endpoints.map((endpoint, index) => (
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
                href={endpoint.domain}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#3794ff] hover:text-[#4fc1ff] break-all underline underline-offset-2 hover:underline-offset-4 transition-all"
              >
                {endpoint.domain}
              </a>

              {endpoint.credentials && endpoint.credentials.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#3e3e42] space-y-2">
                  <div className="text-xs text-gray-400 mb-1.5">Login Credentials:</div>
                  {endpoint.credentials.map((credential) => {
                    const isSecret = Boolean(credential.secret);
                    const isVisible = visibleSecrets[credential.id] ?? false;

                    return (
                      <div
                        key={credential.id}
                        className="flex items-center gap-2 bg-[#252526] rounded p-2 border border-[#3e3e42]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-500 mb-0.5">{credential.label}</div>
                          <code className="text-xs text-blue-400 break-all">
                            {isSecret && !isVisible ? '••••••••••••••••' : credential.value}
                          </code>
                        </div>
                        {isSecret && (
                          <button
                            onClick={() =>
                              setVisibleSecrets((current) => ({
                                ...current,
                                [credential.id]: !isVisible,
                              }))
                            }
                            className="p-1.5 hover:bg-[#37373d] rounded transition-colors shrink-0"
                            title={isVisible ? `Hide ${credential.label.toLowerCase()}` : `Show ${credential.label.toLowerCase()}`}
                          >
                            {isVisible ? (
                              <MdVisibilityOff className="h-3.5 w-3.5 text-gray-400" />
                            ) : (
                              <MdVisibility className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(credential.value, credential.id)}
                          className="p-1.5 hover:bg-[#37373d] rounded transition-colors shrink-0"
                          title={`Copy ${credential.label.toLowerCase()}`}
                        >
                          {copiedField === credential.id ? (
                            <span className="text-xs text-green-400">✓</span>
                          ) : (
                            <MdContentCopy className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Custom exposed ports */}
          {exposedPorts.map((ep) => (
            <div
              key={ep.port}
              className="p-3.5 bg-[#1e1e1e] rounded-lg border border-[#3e3e42] hover:border-[#4e4e52] transition-colors"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-white">Port {ep.port}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#1a3a2a] text-emerald-400 border border-emerald-800">
                    Custom
                  </span>
                </div>
                <button
                  onClick={() => handleUnexposePort(ep.port)}
                  className="p-1 hover:bg-[#37373d] rounded transition-colors"
                  title="Remove port"
                >
                  <MdClose className="h-4 w-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
              <a
                href={ep.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#3794ff] hover:text-[#4fc1ff] break-all underline underline-offset-2 hover:underline-offset-4 transition-all"
              >
                {ep.url}
              </a>
            </div>
          ))}
        </div>

        {/* Expose Port form */}
        {sandboxId && (
          <div className="mt-4 pt-4 border-t border-[#3e3e42]">
            <div className="text-xs text-gray-400 mb-2">Expose a custom port</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={portInput}
                onChange={(e) => {
                  setPortInput(e.target.value);
                  setPortError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isExposing) handleExposePort();
                }}
                placeholder="e.g. 5173"
                min={1}
                max={65535}
                className="flex-1 bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#3794ff] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={handleExposePort}
                disabled={isExposing || !portInput}
                className="px-3 py-1.5 bg-[#3794ff] hover:bg-[#2b7cd8] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-white font-medium transition-colors"
              >
                {isExposing ? 'Exposing...' : 'Expose'}
              </button>
            </div>
            {portError && (
              <div className="text-xs text-red-400 mt-1.5">{portError}</div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
