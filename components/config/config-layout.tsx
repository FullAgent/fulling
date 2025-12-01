/**
 * Shared configuration page layout
 * VSCode Dark Modern style with clean line-based design
 */

'use client';

import type { ReactNode } from 'react';

import { Spinner } from '@/components/ui/spinner';


interface ConfigLayoutProps {
  /** Page title */
  title: string;
  /** Page description */
  description: string;
  /** Main content */
  children: ReactNode;
  /** Loading state */
  loading?: boolean;
}

/**
 * Configuration page layout with VSCode Dark Modern styling
 */
export function ConfigLayout({ title, description, children, loading }: ConfigLayoutProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 sm:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full animate-fade-in-up">
        {/* Header - Clean VSCode style */}
        <div className="flex items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-vscode-heading">{title}</h1>
              <p className="text-vscode-fg/60 mt-1">{description}</p>
            </div>
        </div>

        {/* Content - Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>

  );
}
