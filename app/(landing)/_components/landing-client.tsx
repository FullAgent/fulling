'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';


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
  const { status } = useSession();

  const [authError, setAuthError] = useState<string | null>(null);

  // Handle Get Started button click
  const handleGetStarted = useCallback(() => {
    setAuthError(null);

    if (status === 'authenticated') {
      router.push('/projects');
      return;
    }

    router.push('/login');
  }, [status, router]);

  // Handle Sign In button click
  const handleSignIn = useCallback(() => {
    if (status === 'authenticated') {
      router.push('/projects');
      return;
    }

    router.push('/login');
  }, [status, router]);

  const isButtonLoading = status === 'loading';
  const shouldShowGoToProjects = status === 'authenticated';

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <LandingHeader
        isAuthenticated={status === 'authenticated'}
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
