/**
 * ProjectContentWrapper Component
 *
 * Manages visibility of terminal and content panels based on current route.
 * Uses CSS-based visibility toggling to preserve component state during navigation.
 *
 * Architecture:
 * - Terminal panel: Persisted in layout, never unmounts (preserves WebSocket state)
 * - Content panel: Regular page content (overview, settings, etc.)
 * - Visibility controlled via data attributes + CSS instead of conditional rendering
 *
 * Why this approach:
 * - Leverages Next.js 16 Layout Persistence feature
 * - Avoids component unmount/remount overhead
 * - Maintains WebSocket connections and terminal state
 * - Better performance than Parallel Routes (no redundant RSC fetches)
 */

'use client';

import { usePathname } from 'next/navigation';

import { TerminalContainer } from '@/components/terminal/terminal-container';
import { useProject } from '@/hooks/use-project';

import { StatusBar } from './status-bar';

import styles from './project-content-wrapper.module.css';

// ============================================================================
// Types
// ============================================================================

interface ProjectContentWrapperProps {
  projectId: string;
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function ProjectContentWrapper({
  children,
  projectId,
}: ProjectContentWrapperProps) {
  const { data: project } = useProject(projectId);
  const pathname = usePathname();

  // Determine which panel to display based on current route
  const isTerminalPage = pathname?.endsWith('/terminal') ?? false;

  // Get sandbox from project data
  const sandbox = project?.sandboxes?.[0];

  return (
    <div className={styles.wrapper}>
      {/* Terminal Panel - Persisted across navigation */}
      <div
        data-visible={isTerminalPage}
        className={`${styles.panel} ${styles.terminalPanel}`}
        aria-hidden={!isTerminalPage}
        aria-live={isTerminalPage ? 'polite' : undefined}
        role="region"
        aria-label="Terminal Console"
      >
        {project && (
          <>
            <TerminalContainer
              project={project}
              sandbox={sandbox}
              isVisible={isTerminalPage}
            />
            <StatusBar projectId={projectId} />
          </>
        )}
      </div>

      {/* Content Panel - Regular pages (overview, settings, env, etc.) */}
      <div
        data-visible={!isTerminalPage}
        className={`${styles.panel} ${styles.contentPanel}`}
        aria-hidden={isTerminalPage}
        role="main"
      >
        {children}
      </div>
    </div>
  );
}
