'use client';

import { useMemo, useState } from 'react';
import {
  MdCheck,
  MdContentCopy,
  MdInfo,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConnectionStringProps {
  connectionString: string;
}

export function ConnectionString({ connectionString }: ConnectionStringProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Memoize masked string to avoid recalculation on every render
  const displayValue = useMemo(() => {
    if (isVisible) return connectionString;
    return '•'.repeat(Math.min(connectionString.length, 50));
  }, [connectionString, isVisible]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(connectionString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-muted/30 border border-border rounded-lg p-6 shadow-sm">
      {/* Header with title and badge */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground font-sans">
          Full Connection String
        </h3>
        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
          Read-only
        </span>
      </div>

      {/* Connection string display */}
      <div className="relative group">
        <div
          className={cn(
            'w-full bg-background/50 border border-border rounded-md px-4 py-4',
            'text-sm font-mono text-muted-foreground break-all leading-relaxed shadow-inner',
            'min-h-[3.5rem] flex items-center'
          )}
        >
          {displayValue}
        </div>

        {/* Action buttons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Toggle visibility */}
          <Button
            onClick={() => setIsVisible(!isVisible)}
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            aria-label={isVisible ? 'Hide connection string' : 'Show connection string'}
            aria-pressed={isVisible}
            type="button"
          >
            {isVisible ? <MdVisibilityOff className="h-4 w-4" /> : <MdVisibility className="h-4 w-4" />}
          </Button>

          {/* Copy button */}
          <Button
            onClick={handleCopy}
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            aria-label={copied ? 'Copied' : 'Copy connection string'}
            type="button"
          >
            {copied ? <MdCheck className="h-4 w-4" /> : <MdContentCopy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Footer with info */}
      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
        <MdInfo className="h-3.5 w-3.5" />
        Use this connection string in your application to connect to the database.
      </p>
    </div>
  );
}
