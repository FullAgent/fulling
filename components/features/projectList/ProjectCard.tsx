/**
 * ProjectCard Component
 *
 * Displays a single project card with status, metadata, and action menu
 */

import { memo } from 'react';
import { MdAccessTime } from 'react-icons/md';
import type { Prisma } from '@prisma/client';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getStatusBgClasses, getStatusTextColor } from '@/lib/util/status-colors';
import { cn } from '@/lib/utils';

import ProjectCardDropdown from './ProjectCardDropdown';

type ProjectWithResources = Prisma.ProjectGetPayload<{
  include: {
    sandboxes: true;
    databases: true;
    environments: true;
  };
}>;

interface ProjectCardProps {
  project: ProjectWithResources;
}

const ProjectCard = memo(({ project }: ProjectCardProps) => {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="group bg-card border border-border rounded-md p-5 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 cursor-pointer flex flex-col gap-4 h-full">
        <CardHeader className="px-0 pt-0 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <CardTitle className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                {project.name}
              </CardTitle>
            </div>
            <ProjectCardDropdown project={project} />
          </div>
          
          <CardDescription className="line-clamp-2 min-h-10 text-sm mt-2">
            {project.description || 'No description'}
          </CardDescription>
        </CardHeader>

        {/* Horizontal divider matching content width */}
        <div className="border-t border-border" />

        <CardFooter className="flex items-center justify-between px-0">
          <div className="flex items-center gap-x-2">
            <Badge
              className={cn(
                "h-2 w-2 p-0 border-0",
                getStatusBgClasses(project.status)
              )}
            />
            <span className={cn('text-xs', getStatusTextColor(project.status))}>
              {project.status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MdAccessTime className="h-3 w-3" />
            <span>
              {new Date(project.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;