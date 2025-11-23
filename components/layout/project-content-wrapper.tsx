'use client';

import { usePathname } from 'next/navigation';

import { TerminalContainer, type TerminalContainerProps } from '@/components/terminal/terminal-container';

interface ProjectContentWrapperProps extends TerminalContainerProps {
  children: React.ReactNode;
}

export function ProjectContentWrapper({
  children,
  project,
  sandbox,
}: ProjectContentWrapperProps) {
  const pathname = usePathname();
  // Check if the current path ends with /terminal
  const isTerminalPage = pathname?.endsWith('/terminal');

  return (
    <>
      <div 
        className="w-full h-full"
        style={{ display: isTerminalPage ? 'block' : 'none' }}
      >
        <TerminalContainer 
          project={project} 
          sandbox={sandbox} 
          isVisible={isTerminalPage}
        />
      </div>
      <div 
        className="w-full h-full"
        style={{ display: !isTerminalPage ? 'block' : 'none' }}
      >
        {children}
      </div>
    </>
  );
}
