/**
 * Settings page layout component
 * Used for project settings pages (database, environments, etc.)
 * VSCode Dark Modern style with clean design
 */

'use client';

import type { ReactNode } from 'react';

import { Spinner } from '@/components/ui/spinner';

interface SettingsLayoutProps {
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
 * Layout wrapper for project settings pages
 */
export function SettingsLayout({ title, description, children, loading }: SettingsLayoutProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 sm:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full animate-fade-in-up">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </header>

        {/* Page Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
