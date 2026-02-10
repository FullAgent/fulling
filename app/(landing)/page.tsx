'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { authenticateWithSealos } from '@/lib/actions/sealos-auth';
import { useSealos } from '@/provider/sealos';

import { LandingHeader } from './_components/landing-header';
import { HeroSection } from './_components/hero-section';
import { TerminalDemo } from './_components/terminal-demo';

/**
 * Landing page with unified rendering.
 *
 * Get Started Button Behavior:
 * - Non-Sealos + Authenticated: Go to /projects
 * - Non-Sealos + Unauthenticated: Go to /login
 * - Sealos + Authenticated: Go to /projects
 * - Sealos + Unauthenticated: Trigger Sealos auth → then go to /projects
 */
export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const { isInitialized, isLoading, isSealos, sealosToken, sealosKubeconfig } = useSealos();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Determine button action based on environment and auth status
  const handleGetStarted = useCallback(async () => {
    // Clear previous errors on retry
    setAuthError(null);

    // Already authenticated - go to projects
    if (status === 'authenticated') {
      router.push('/projects');
      return;
    }

    // Non-Sealos environment - go to login
    if (!isSealos) {
      router.push('/login');
      return;
    }

    // Sealos environment + unauthenticated - trigger Sealos auth
    if (!sealosToken || !sealosKubeconfig) {
      setAuthError('Missing Sealos credentials');
      return;
    }

    setIsAuthenticating(true);

    try {
      const result = await authenticateWithSealos(sealosToken, sealosKubeconfig);

      if (result.success) {
        // Authentication successful - redirect to projects
        router.push('/projects');
        router.refresh();
      } else {
        setAuthError(result.error || 'Authentication failed');
        setIsAuthenticating(false);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unknown error');
      setIsAuthenticating(false);
    }
  }, [status, isSealos, sealosToken, sealosKubeconfig, router]);

  const handleSignIn = useCallback(() => {
    if (status === 'authenticated') {
      router.push('/projects');
    } else {
      router.push('/login');
    }
  }, [status, router]);

  // Show minimal loading during initialization
  const isInitializing = !isInitialized || isLoading;
  const isButtonDisabled = isInitializing || isAuthenticating;

  return (
    <>
      <div className="h-screen overflow-hidden flex flex-col">
        <LandingHeader
          isAuthenticated={status === 'authenticated'}
          onSignIn={handleSignIn}
        />
        <main className="flex-1 flex flex-col lg:flex-row pt-16">
          <HeroSection
            onGetStarted={handleGetStarted}
            isLoading={isButtonDisabled}
            authError={authError}
          />
          <TerminalDemo />
        </main>
      </div>

      {/* Authentication overlay - shown during Sealos auth process */}
      {isAuthenticating && (
        <div
          className="fixed inset-0 bg-background/90 flex items-center justify-center z-50"
          role="dialog"
          aria-label="Authentication in progress"
          aria-modal="true"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Authenticating with Sealos...</p>
          </div>
        </div>
      )}
    </>
  );
}
