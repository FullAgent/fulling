'use client';

import { useEffect } from 'react';
import { AlertCircle, Home,RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center py-12">
      <div className="w-full max-w-2xl px-4">
        {/* Error Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="shrink-0 mt-1">
            <AlertCircle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-semibold text-white mb-2">Something went wrong</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              An unexpected error occurred. Please try again or return to the home page.
            </p>
          </div>
        </div>

        {/* Error Details */}
        {error.digest && (
          <div className="mb-8 bg-[#1e1e1e] border border-gray-800 rounded-lg p-6 font-mono">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
              <span className="text-red-400">✗</span>
              <span>Error Reference</span>
            </div>
            <div className="text-red-400 text-sm">{error.digest}</div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            size="lg"
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start gap-3 rounded-md"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Try Again</span>
          </Button>
          <Link href="/" className="block">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-900 hover:text-white justify-start gap-3 rounded-md"
            >
              <Home className="h-5 w-5" />
              <span>Go to Home</span>
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500 text-center">
            If this problem persists, please{' '}
            <a
              href="https://github.com/FullAgent/fulling/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              open an issue
            </a>
            {' '}on GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
