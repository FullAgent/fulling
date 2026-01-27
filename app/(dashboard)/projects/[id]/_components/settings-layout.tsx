/**
 * Settings page layout component
 * Used for project settings pages (database, environments, etc.)
 * VSCode Dark Modern style with clean design
 */

'use client';

import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

interface SettingsLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  loading?: boolean;
}

/**
 * Layout wrapper for project settings pages
 * Uses skeleton to maintain layout stability during loading
 */
export function SettingsLayout({ title, description, children, loading }: SettingsLayoutProps) {
  return (
    <div className="flex-1 px-8 py-10 pb-20 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </header>

        <div className="space-y-8">
          {loading ? (
            <>
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
