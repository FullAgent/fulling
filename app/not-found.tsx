import { MdArrowBack, MdHelpOutline, MdHome } from 'react-icons/md';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center py-12">
      <div className="w-full max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="shrink-0 mt-1">
            <MdHelpOutline className="h-12 w-12 text-gray-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-semibold text-white mb-2">Page Not Found</h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>

        {/* 404 Code Box */}
        <div className="mb-8 bg-[#1e1e1e] border border-gray-800 rounded-lg p-6 font-mono">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
            <span className="text-yellow-400">⚠</span>
            <span>HTTP Status</span>
          </div>
          <div className="text-yellow-400 text-sm">404 - NOT_FOUND</div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start gap-3 rounded-md"
            >
              <MdHome className="h-5 w-5" />
              <span>Go to Home</span>
            </Button>
          </Link>
          <Link href="/projects" className="block">
            <Button
              size="lg"
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-900 hover:text-white justify-start gap-3 rounded-md"
            >
              <MdArrowBack className="h-5 w-5" />
              <span>Back to Projects</span>
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500 text-center">
            Check the URL for typos, or use the navigation above to find what you need.
          </p>
        </div>
      </div>
    </div>
  );
}
