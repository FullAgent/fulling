import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useAppRunner(sandboxId: string | undefined) {
  const [isStartingApp, setIsStartingApp] = useState(false);
  const [isStoppingApp, setIsStoppingApp] = useState(false);
  const [isAppRunning, setIsAppRunning] = useState(false);

  // Check app status on mount
  useEffect(() => {
    if (!sandboxId) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/sandbox/${sandboxId}/app-status`);
        const data = await response.json();
        setIsAppRunning(data.running);
      } catch (error) {
        console.error('Failed to check app status:', error);
      }
    };

    checkStatus();
  }, [sandboxId]);

  // Start application in background
  const startApp = useCallback(async () => {
    if (!sandboxId || isStartingApp) return;

    setIsStartingApp(true);

    // Send exec command (fire and forget, don't wait for response)
    fetch(`/api/sandbox/${sandboxId}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'pnpm run build && pnpm run start',
        workdir: '/home/fulling/next',
      }),
    }).catch(() => {
      // Ignore errors, we'll detect success via port polling
    });

    toast.info('Starting...', {
      description: 'Building and starting your app. This may take a few minutes.',
    });

    // Poll for app status every 10 seconds, max 5 minutes
    const maxAttempts = 30; // 30 * 10s = 5 minutes
    let attempts = 0;

    const pollStatus = async (): Promise<boolean> => {
      try {
        const response = await fetch(`/api/sandbox/${sandboxId}/app-status`);
        const data = await response.json();
        return data.running;
      } catch {
        return false;
      }
    };

    const poll = async () => {
      while (attempts < maxAttempts) {
        attempts++;
        const running = await pollStatus();
        if (running) {
          setIsAppRunning(true);
          setIsStartingApp(false);
          toast.success('App Running', {
            description: 'Your app is live in the background',
          });
          return;
        }
        // Wait 10 seconds before next check
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      // Timeout after max attempts
      setIsStartingApp(false);
      toast.error('Start Timeout', {
        description: 'App did not start within 5 minutes. Check terminal for errors.',
      });
    };

    poll();
  }, [sandboxId, isStartingApp]);

  // Stop application
  const stopApp = useCallback(async () => {
    if (!sandboxId || isStoppingApp) return;

    setIsStoppingApp(true);
    try {
      const response = await fetch(`/api/sandbox/${sandboxId}/app-status`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setIsAppRunning(false);
        toast.success('App Stopped');
      } else {
        toast.error('Stop Failed', {
          description: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Failed to stop app:', error);
      toast.error('Stop Failed', {
        description: 'Network error, please try again',
      });
    } finally {
      setIsStoppingApp(false);
    }
  }, [sandboxId, isStoppingApp]);

  return {
    isStartingApp,
    isStoppingApp,
    isAppRunning,
    startApp,
    stopApp,
  };
}
