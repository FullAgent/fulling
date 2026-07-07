'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { HeroSection } from './hero-section';
import { LandingHeader } from './landing-header';
import { TerminalDemo } from './terminal-demo';

interface LandingClientProps {
  starCount: number | null;
}

/**
 * Client-side landing page shell.
 *
 * Handles all interactive logic (auth, navigation) while receiving
 * server-fetched data (starCount) as props.
 *
 * Authentication Flow (v2.0.0):
 * - Sealos environment: Auto-trigger auth on page load if unauthenticated
 * - Non-Sealos + Authenticated: Show "Go to Projects" button
 * - Non-Sealos + Unauthenticated: Show "Start Building Now" → /login
 * - Authentication success: Update button text, user clicks to navigate
 */
export function LandingClient({ starCount }: LandingClientProps) {
  const router = useRouter();

  const [authError, setAuthError] = useState<string | null>(null);

  // Handle Get Started button click
  const handleGetStarted = useCallback(() => {
    setAuthError(null);
    router.push('/login');
  }, [router]);

  // Handle Sign In button click
  const handleSignIn = useCallback(() => {
    router.push('/login');
  }, [router]);

  const isButtonLoading = false;
  const shouldShowGoToProjects = false;

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <LandingHeader
        isAuthenticated={false}
        isSealos={false}
        onSignIn={handleSignIn}
        starCount={starCount}
        isLoading={isButtonLoading}
      />
      <main className="flex-1 flex flex-col lg:flex-row pt-16">
        <HeroSection
          onGetStarted={handleGetStarted}
          isLoading={isButtonLoading}
          authError={authError}
          buttonText={shouldShowGoToProjects ? 'Go to Projects' : 'Start Building Now'}
        />
        <TerminalDemo />
      </main>
    </div>
  );
}
