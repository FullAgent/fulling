'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================================================
// Types
// ============================================================================

export interface NetworkEndpoint {
  domain: string | null | undefined;
  port: number;
  protocol: string;
  label: string;
  hasCredentials?: boolean;
}

export interface NetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoints: NetworkEndpoint[];
  fileBrowserCredentials?: {
    username: string;
    password: string;
  };
}

// ============================================================================
// Component
// ============================================================================

export function NetworkDialog({
  open,
  onOpenChange,
  endpoints,
  fileBrowserCredentials,
}: NetworkDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
  );
}
