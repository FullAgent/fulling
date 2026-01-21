'use client';

import React from 'react';

import { RepoStatusIndicator } from '@/components/layout/repo-status-indicator';
import { useProject } from '@/hooks/use-project';
import { getStatusBgColor } from '@/lib/util/status-colors';

interface StatusBarProps {
  projectId: string;
}

export function StatusBar({ projectId }: StatusBarProps) {
  const { data: project } = useProject(projectId);
  
  const database = project?.databases?.[0];
  const dbStatus = database?.status || 'CREATING';
  const sandbox = project?.sandboxes?.[0];
  const sbStatus = sandbox?.status || 'CREATING';

  return (
    <div className="h-8 bg-sidebar-background text-card-foreground [&_span]:text-card-foreground flex items-center justify-between px-2 text-xs select-none z-50">
      <div className="flex items-center gap-4">
        {project && (
          <RepoStatusIndicator 
            project={project}
          />
        )}

      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-1 rounded cursor-pointer transition-colors">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_1px_0.5px_currentColor] ${getStatusBgColor(sbStatus)}`} />
          <span>Sandbox: {sbStatus}</span>
        </div>
        <div className="w-px h-3 bg-card-foreground/60 mx-1" />
        <div className="flex items-center gap-1.5 px-1 rounded cursor-pointer transition-colors">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_1px_0.5px_currentColor] ${getStatusBgColor(dbStatus)}`} />
          <span>Database: {dbStatus}</span>
        </div>
      </div>
    </div>
  );
}
