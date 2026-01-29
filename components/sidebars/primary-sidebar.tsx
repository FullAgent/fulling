'use client';

import { useState } from 'react';
import { MdOutlineGridView, MdOutlineSettings } from 'react-icons/md';
import Image from 'next/image';
import Link from 'next/link';

import SettingsDialog from '@/components/dialog/settings-dialog';
import { Button } from '@/components/ui/button';

/**
 * PrimarySidebar Component
 *
 * This is the persistent left-most command center of the application with a fixed width.
 * It remains visible across page transitions, providing global access to core functionalities.
 *
 * Structure:
 * 1. Top Section: Contains 'Home' and 'Projects' navigation buttons.
 * 2. Bottom Section: Contains 'Settings' button which triggers the settings dialog.
 *
 * Note: Marked with 'use client' as it manages local state (useState) for the settings dialog.
 */
export default function PrimarySidebar() {
  return (
    <aside className="w-14 flex flex-col items-center py-4 bg-black border-r border-border flex-shrink-0 z-20">
      {/* Top buttons */}
      <div className="space-y-2 flex flex-col items-center">
        <HomeButton />
        <ProjectsButton />
      </div>

      {/* Bottom buttons */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <SettingsButton />
      </div>
    </aside>
  );
}

function HomeButton() {
  return (
    <Button variant="ghost" size="icon" asChild className="group hover:bg-transparent">
      <Link href="/">
        <Image
          src="/icon-transparent.svg"
          alt="Fulling"
          width={24}
          height={24}
          className="rounded-full opacity-80 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_12px_color-mix(in_srgb,var(--primary),transparent_40%)] group-hover:shadow-[0_0_16px_color-mix(in_srgb,var(--primary),transparent_10%)]"
        />
      </Link>
    </Button>
  );
}

function ProjectsButton() {
  return (
    <Button variant="ghost" size="icon" asChild className="group hover:bg-transparent">
      <Link href="/projects">
        <MdOutlineGridView className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
      </Link>
    </Button>
  );
}

function SettingsButton() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSettings(true)}
        className="group hover:bg-transparent"
      >
        <MdOutlineSettings className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
      </Button>
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
