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

import { TerminalContainer, type TerminalContainerProps } from '@/components/terminal/terminal-container';

import styles from './project-content-wrapper.module.css';

// ============================================================================
// Types
// ============================================================================

interface ProjectContentWrapperProps extends TerminalContainerProps {
  children: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function ProjectContentWrapper({
  children,
  project,
  sandbox,
}: ProjectContentWrapperProps) {
  const pathname = usePathname();

  // Determine which panel to display based on current route
  const isTerminalPage = pathname?.endsWith('/terminal') ?? false;

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
        <TerminalContainer
          project={project}
          sandbox={sandbox}
          isVisible={isTerminalPage}
        />
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
