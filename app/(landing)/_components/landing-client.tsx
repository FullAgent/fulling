'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { authenticateWithSealos } from '@/lib/actions/sealos-auth';
import { useSealos } from '@/provider/sealos';

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
 * Authentication Flow (v2.0.0-alpha-3):
 * - Sealos environment: Auto-trigger auth on page load if unauthenticated
 * - Non-Sealos + Authenticated: Show "Go to Projects" button
 * - Non-Sealos + Unauthenticated: Show "Start Building Now" → /login
 * - Authentication success: Update button text, user clicks to navigate
 */
export function LandingClient({ starCount }: LandingClientProps) {
  const router = useRouter();
  const { status } = useSession();
  const { isInitialized, isLoading, isSealos, sealosToken, sealosKubeconfig } = useSealos();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const hasAttemptedAuth = useRef(false); // Prevent duplicate auth attempts

  // Auto-trigger authentication in Sealos environment
  useEffect(() => {
    // Wait for Sealos initialization
    if (!isInitialized || isLoading) return;

    // Already authenticated, no need to auth again
    if (status === 'authenticated') return;

    // Not in Sealos, don't auto-authenticate
    if (!isSealos) return;

    // Prevent duplicate attempts
    if (hasAttemptedAuth.current) return;
    hasAttemptedAuth.current = true;

    // Check credentials
    if (!sealosToken || !sealosKubeconfig) {
      queueMicrotask(() => {
        setAuthError('Missing Sealos credentials');
      });
      return;
    }

    // Trigger authentication
    queueMicrotask(() => {
      setIsAuthenticating(true);
    });

    authenticateWithSealos(sealosToken, sealosKubeconfig)
      .then((result) => {
        if (result.success) {
          // Authentication successful - don't auto-redirect, let user click
          setIsAuthenticating(false);
          router.refresh(); // Refresh session
        } else {
          setAuthError(result.error || 'Authentication failed');
          setIsAuthenticating(false);
          hasAttemptedAuth.current = false; // Allow retry
        }
      })
      .catch((error) => {
        setAuthError(error instanceof Error ? error.message : 'Unknown error');
        setIsAuthenticating(false);
        hasAttemptedAuth.current = false; // Allow retry
      });
  }, [isInitialized, isLoading, status, isSealos, sealosToken, sealosKubeconfig, router]);

  // Handle Get Started button click
  const handleGetStarted = useCallback(() => {
    setAuthError(null);

    // Authenticated users go to projects
    if (status === 'authenticated') {
      router.push('/projects');
      return;
    }

    // Non-Sealos environment - go to login
    if (!isSealos) {
      router.push('/login');
      return;
    }

    // Sealos environment - retry authentication
    hasAttemptedAuth.current = false;
  }, [status, isSealos, router]);

  // Handle Sign In button click
  const handleSignIn = useCallback(() => {
    if (status === 'authenticated') {
      router.push('/projects');
    } else if (isSealos) {
      // Sealos environment - retry auth
      hasAttemptedAuth.current = false;
      setAuthError(null);
    } else {
      router.push('/login');
    }
  }, [status, isSealos, router]);

  // Button state and text logic
  const isInitializing = !isInitialized || isLoading;
  const isButtonLoading = isInitializing || isAuthenticating;
  const shouldShowGoToProjects = isSealos || status === 'authenticated';

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <LandingHeader
        isAuthenticated={status === 'authenticated'}
        isSealos={isSealos}
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
