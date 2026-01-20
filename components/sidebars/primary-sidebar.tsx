'use client';

import { useState } from 'react';
import Link from 'next/link';

import SettingsDialog from '@/components/dialog/settings-dialog';

export default function PrimarySidebar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <aside className="w-14 flex flex-col items-center py-4 bg-black border-r border-border flex-shrink-0 z-20">
      {/* Top buttons */}
      <div className="space-y-6 flex flex-col items-center">
        <Link href="/projects" className="group">
          <span className="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors">folder</span>
        </Link>
        <button className="group">
          <span className="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors">search</span>
        </button>
        <button className="group">
          <span className="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors">grid_view</span>
        </button>
      </div>

      {/* Bottom buttons */}
      <div className="mt-auto flex flex-col items-center gap-6">
        <button className="group">
          <span className="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors">account_circle</span>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="group"
        >
          <span className="material-icons-outlined text-gray-400 group-hover:text-primary transition-colors">settings</span>
        </button>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </aside>
  );
}
