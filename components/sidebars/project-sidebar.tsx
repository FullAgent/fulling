'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  Github,
  Key,
  Package,
  Shield,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useProject } from '@/hooks/use-project';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  projectId: string;
}

export default function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const { data: project } = useProject(projectId);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const topSections = [
    {
      id: 'terminal',
      label: 'Web Terminal',
      icon: Terminal,
      href: `/projects/${projectId}/terminal`,
    },
    { id: 'database', label: 'Database', icon: Database, href: `/projects/${projectId}/database` },
  ];

  const configSections = [
    {
      id: 'environment',
      label: 'Environment Variables',
      icon: Package,
      href: `/projects/${projectId}/environment`,
    },
    {
      id: 'secrets',
      label: 'Secret Configuration',
      icon: Key,
      href: `/projects/${projectId}/secrets`,
    },
    { id: 'auth', label: 'Auth Configuration', icon: Shield, href: `/projects/${projectId}/auth` },
    {
      id: 'payment',
      label: 'Payment Configuration',
      icon: CreditCard,
      href: `/projects/${projectId}/payment`,
    },
    {
      id: 'github',
      label: 'GitHub Integration',
      icon: Github,
      href: `/projects/${projectId}/github`,
    },
  ];

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
      <div className="h-12 flex items-center px-3 border-b border-border min-w-0 overflow-hidden">
        {!isCollapsed && (
          <span className="text-sm font-medium text-foreground truncate">Project {project?.name ?? 'Loading...'}</span>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {/* Top sections */}
          <div>
            <div className="px-3 pt-4 pb-2 text-xs font-semibold text-muted-foreground">WORKSPACE</div>
            {topSections.map((section) => {
              const Icon = section.icon;
              const isActive = pathname === section.href;

              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={cn(
                    'group w-full flex items-center pl-6 pr-3 py-2 text-base transition-colors min-h-[32px]',
                    isActive ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-sidebar-foreground shrink-0 transition-colors" />
                  <span className={cn("truncate flex-1 font-semibold", isActive ? "text-card-foreground" : "text-foreground")}>{section.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Configuration Group */}
          <div>
            <div className="px-3 pt-4 pb-2 text-xs font-semibold text-muted-foreground">CONFIGURATION</div>
            {configSections.map((section) => {
              const Icon = section.icon;
              const isActive = pathname === section.href;

              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={cn(
                    'group w-full flex items-center pl-6 pr-3 py-2 text-base transition-colors min-h-[32px]',
                    isActive ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-sidebar-foreground shrink-0 transition-colors" />
                  <span className={cn("truncate flex-1 font-semibold", isActive ? "text-card-foreground" : "text-foreground")}>{section.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
