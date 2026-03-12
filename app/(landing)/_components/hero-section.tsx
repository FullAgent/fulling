'use client';

import { MdCheckCircle, MdOpenInNew, MdRocketLaunch } from 'react-icons/md';

import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onGetStarted: () => void;
  isLoading: boolean;
  authError: string | null;
  buttonText: string;  // Dynamic button text based on auth/environment
}

export function HeroSection({
  onGetStarted,
  isLoading,
  authError,
  buttonText,
}: HeroSectionProps) {
  return (
    <div className="w-full lg:w-1/2 h-full flex flex-col justify-center px-8 sm:px-12 lg:px-20 relative z-10 bg-background">
      {/* Background glow effect */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl animate-fade-in">
        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-8 w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          New in Fulling v2
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl lg:text-7xl font-[family-name:var(--font-heading)] font-bold text-foreground tracking-tight mb-6 leading-[1.1]">
          Describe the app. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
            Fulling handles the rest.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl font-[family-name:var(--font-heading)] font-medium text-muted-foreground leading-relaxed mb-10 max-w-xl">
          Import an existing repo or start from scratch. Agents set up the workspace, runtime,
          database, and deployment in the background.
        </p>

        {/* Error message */}
        {authError && (
          <div
            className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded text-destructive text-sm max-w-md"
            role="alert"
            aria-live="polite"
          >
            {authError}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={onGetStarted}
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full sm:w-auto h-11 px-6 font-[family-name:var(--font-heading)] font-medium gap-2"
          >
            <MdRocketLaunch className="text-[20px] -ml-1" />
            <span>{buttonText}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-11 px-6 font-medium gap-2"
            asChild
          >
            <a
              href="https://github.com/FullAgent/fulling"
              target="_blank"
              rel="noopener"
            >
              <MdOpenInNew className="text-[20px] -ml-1" />
              <span>See on GitHub</span>
            </a>
          </Button>
        </div>

        {/* Features */}
        {FEATURES_JSX}
      </div>
    </div>
  );
}

// Static JSX hoisted outside component to avoid recreation on every render
const FEATURES_JSX = (
  <div className="mt-12 grid gap-3 text-sm text-muted-foreground max-w-xl">
    <div className="flex items-center gap-2">
      <MdCheckCircle className="text-[16px]" />
      <span>Start from a prompt or import from GitHub</span>
    </div>
    <div className="flex items-center gap-2">
      <MdCheckCircle className="text-[16px]" />
      <span>Add PostgreSQL only when you need it</span>
    </div>
    <div className="flex items-center gap-2">
      <MdCheckCircle className="text-[16px]" />
      <span>Agents handle deploy, runtime, and infra automatically</span>
    </div>
  </div>
);
