'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight, ExternalLink } from 'lucide-react';

import { authenticateWithSealos } from '@/app/actions/sealos-auth';
import { Button } from '@/components/ui/button';
import { useSealos } from '@/provider/sealos';

import { MatrixRain } from '@/components/MatrixRain';

/**
 * Home page client component with unified rendering.
 *
 * Get Started Button Behavior:
 * - Non-Sealos + Authenticated: Go to /projects
 * - Non-Sealos + Unauthenticated: Go to /login
 * - Sealos + Authenticated: Go to /projects
 * - Sealos + Unauthenticated: Trigger Sealos auth → then go to /projects
 */
export function HomePage() {
  const router = useRouter();
  const { status } = useSession();
  const { isInitialized, isLoading, isSealos, sealosToken, sealosKubeconfig } = useSealos();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Determine button action based on environment and auth status
  const handleGetStarted = async () => {
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
  };

  const getButtonText = useCallback(() => {
    if (status === 'authenticated') {
      return 'Go to Projects';
    }
    return 'Get Started';
  }, [status]);

  // Show minimal loading during initialization
  const isInitializing = !isInitialized || isLoading;
  const isButtonDisabled = isInitializing || isAuthenticating;

  return (
    <>
      {/* Base marketing page - always visible */}
      <div className="min-h-screen flex flex-col items-center justify-start pt-32">
        {/* Matrix Background Effect */}
        <MatrixRain />

        <div className="max-w-4xl mx-auto px-4 py-12 text-center flex flex-col items-center space-y-8 bg-background/80 backdrop-blur-sm rounded-xl border border-border/20 shadow-2xl">

          {/* Hero Section: Logo and Title */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-4 md:gap-6">
              <Image
                src="/icon-transparent.svg"
                alt="Fulling Logo"
                width={80}
                height={80}
                className="w-16 h-16 md:w-20 md:h-20"
              />
              <h1 className="md:text-6xl lg:text-8xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text leading-normal text-transparent">
                Fulling
              </h1>
            </div>

            {/* Subtitle and Description */}
            <p className="text-xl text-primary mb-12">AI-Powered Full-Stack Development Platform</p>
            <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
              Create, develop, and deploy production-ready web applications using natural language.
              Powered by <span className="text-[#d97757] bg-[#d97757]/10 px-1 py-0.5 rounded-md font-mono border-x border-[#d97757]">Claude Code</span> in isolated sandbox environments.
            </p>
          </div>



          {/* Divider with VS Code styling */}
          <div className="w-32 h-1 bg-secondary rounded-full"></div>

          {/* Error message - with aria attributes for accessibility */}
          {authError && (
            <div
              className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded text-destructive text-sm max-w-md mx-auto"
              role="alert"
              aria-live="polite"
            >
              {authError}
            </div>
          )}

          <div className="flex gap-8 justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              disabled={isButtonDisabled}
              aria-busy={isAuthenticating}
              className="w-48"
            >
              {getButtonText()}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              title="Learn more about FullStack Agent (Coming Soon)"
              className="w-48"
            >
              Learn More
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">Authenticating with Sealos...</p>
          </div>
        </div>
      )}
    </>
  );
}
