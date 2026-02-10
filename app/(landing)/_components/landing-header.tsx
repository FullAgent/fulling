'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface LandingHeaderProps {
  isAuthenticated: boolean;
  onSignIn?: () => void;
  starCount: number | null;
}

function formatStarCount(count: number): string {
  if (count >= 1000) {
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(count);
  }
  return count.toString();
}

export function LandingHeader({ isAuthenticated, onSignIn, starCount }: LandingHeaderProps) {
  return (
    <header className="w-full h-16 border-b border-border bg-background/80 backdrop-blur-md fixed top-0 left-0 z-50">
      <div className="max-w-[1920px] mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/icon-transparent.svg"
            alt="Fulling Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-foreground font-[family-name:var(--font-heading)] font-bold text-lg tracking-tight">
            Fulling
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6" aria-label="Main navigation">
          <Link
            href="https://github.com/FullAgent/fulling#readme"
            target="_blank"
            rel="noopener"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Documentation
          </Link>

          <div className="h-4 w-px bg-border" aria-hidden="true" />

          {/* GitHub Star Count */}
          <Link
            href="https://github.com/FullAgent/fulling"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span className="text-sm font-medium font-[variant-numeric:tabular-nums]">
              {starCount !== null ? formatStarCount(starCount) : 'Star'}
            </span>
          </Link>

          {/* Sign In Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onSignIn}
            className="font-[family-name:var(--font-heading)]"
          >
            {isAuthenticated ? 'Go to Projects' : 'Sign In'}
          </Button>
        </nav>
      </div>
    </header>
  );
}

