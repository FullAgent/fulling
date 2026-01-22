'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MdOutlineTerminal,
  MdOutlineDns,
  MdOutlineLayers,
  MdOutlineVpnKey,
  MdOutlineSecurity,
  MdOutlineCreditCard,
  MdOutlineCode,
} from 'react-icons/md';
import { IconType } from 'react-icons';

import { useProject } from '@/hooks/use-project';
import { cn } from '@/lib/utils';

// Icon mapping for dynamic icon rendering
const ICON_MAP: Record<string, IconType> = {
  terminal: MdOutlineTerminal,
  dns: MdOutlineDns,
  layers: MdOutlineLayers,
  vpn_key: MdOutlineVpnKey,
  security: MdOutlineSecurity,
  credit_card: MdOutlineCreditCard,
  code: MdOutlineCode,
};

// Static menu configuration - hoisted outside component to avoid recreation on every render
const WORKSPACE_SECTIONS = [
  { id: 'terminal', label: 'Web Terminal', icon: 'terminal' },
  { id: 'database', label: 'Database', icon: 'dns' },
] as const;

const CONFIG_SECTIONS = [
  { id: 'environment', label: 'Environment Variables', icon: 'layers' },
  { id: 'secrets', label: 'Secret Configuration', icon: 'vpn_key' },
  { id: 'auth', label: 'Auth Configuration', icon: 'security' },
  { id: 'payment', label: 'Payment Configuration', icon: 'credit_card' },
  { id: 'github', label: 'GitHub Integration', icon: 'code' },
] as const;

interface ProjectSidebarProps {
  projectId: string;
}

/**
 * A collapsible navigation sidebar for project detail pages.
 *
 * Features:
 * - Displays current project name in header
 * - Provides navigation links grouped into Workspace and Configuration sections
 * - Supports collapse/expand toggle with smooth transition
 * - Highlights active route based on current pathname
 *
 * Navigation Structure:
 * - Workspace: Web Terminal, Database
 * - Configuration: Environment Variables, Secrets, Auth, Payment, GitHub Integration
 */
export default function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const { data: project } = useProject(projectId);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Generate href with projectId
  const getHref = (sectionId: string) => `/projects/${projectId}/${sectionId}`;

  return (
    <div
      className={cn(
        'bg-sidebar-background flex flex-col transition-all duration-200 relative',
        isCollapsed ? 'w-0' : 'w-72 border-r border-border'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-4 rounded-md border border-border bg-sidebar-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-border min-w-0 overflow-hidden">
        {!isCollapsed && (
          <span className="text-sm font-medium text-foreground truncate">Project {project?.name ?? 'Loading...'}</span>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {/* Top sections */}
          <div>
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workspace</div>
            <ul className="space-y-0.5">
            {WORKSPACE_SECTIONS.map((section) => {
              const href = getHref(section.id);
              const isActive = pathname === href;
              const IconComponent = ICON_MAP[section.icon];

              return (
                <li key={section.id}>
                  <Link
                    href={href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all',
                      isActive
                        ? 'bg-accent text-foreground font-medium shadow-sm ring-1 ring-white/5'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <IconComponent className={cn('w-4 h-4', isActive && 'text-foreground')} />
                    {section.label}
                  </Link>
                </li>
              );
            })}
            </ul>
          </div>

          {/* Configuration Group */}
          <div>
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Configuration</div>
            <ul className="space-y-0.5">
            {CONFIG_SECTIONS.map((section) => {
              const href = getHref(section.id);
              const isActive = pathname === href;
              const IconComponent = ICON_MAP[section.icon];

              return (
                <li key={section.id}>
                  <Link
                    href={href}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all',
                      isActive
                        ? 'bg-accent text-foreground font-medium shadow-sm ring-1 ring-white/5'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <IconComponent className={cn('w-4 h-4', isActive && 'text-foreground')} />
                    {section.label}
                  </Link>
                </li>
              );
            })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
