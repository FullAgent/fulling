import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

import { ProjectContentWrapper } from '@/components/layout/project-content-wrapper';
import { StatusBar } from '@/components/layout/status-bar';
import PrimarySidebar from '@/components/sidebars/primary-sidebar';
import ProjectSidebar from '@/components/sidebars/project-sidebar';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  // Only need to check if project exists and belongs to user
  // All components fetch their own data via useProject hook
  const project = await prisma.project.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    notFound();
  }


  return (
    <div className="h-screen flex flex-col text-foreground overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Primary Sidebar - VSCode style */}
        <PrimarySidebar />

        {/* Secondary Sidebar - Project Settings */}
        <ProjectSidebar
          projectId={id}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          <ProjectContentWrapper projectId={id}>
            {children}
          </ProjectContentWrapper>
        </div>
      </div>
      
      <StatusBar projectId={id} />
    </div>
  );
}
