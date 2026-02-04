import { cache } from 'react';
import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Project relation include options
 */
export type ProjectInclude = {
  sandboxes?: boolean;
  databases?: boolean;
  environments?: boolean;
};

/**
 * Project with relations based on include options
 */
export type ProjectWithRelations<T extends ProjectInclude = ProjectInclude> =
  Prisma.ProjectGetPayload<{ include: T }>;

/**
 * Get a project by ID and user ID
 * Uses React.cache() to deduplicate calls within the same request
 * @param include - Optional relation loading (default: all false)
 */
export const getProject = cache(async function getProject(
  projectId: string,
  userId: string,
  include?: ProjectInclude
): Promise<ProjectWithRelations | null> {
  const shouldInclude: Required<ProjectInclude> = {
    sandboxes: false,
    databases: false,
    environments: false,
    ...include,
  };

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: shouldInclude,
    });

    if (!project) {
      logger.warn(`Project ${projectId} not found for user ${userId}`);
      return null;
    }

    return project;
  } catch (error) {
    logger.error(`Failed to fetch project ${projectId}: ${error}`);
    throw error;
  }
});

/**
 * Get all projects for a user
 * Uses React.cache() to deduplicate calls within the same request
 * @param userId - The user ID
 * @param include - Optional relation loading (default: all false)
 */
export const getProjects = cache(async function getProjects(
  userId: string,
  include?: ProjectInclude
): Promise<ProjectWithRelations[]> {
  const shouldInclude: Required<ProjectInclude> = {
    sandboxes: false,
    databases: false,
    environments: false,
    ...include,
  };

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: shouldInclude,
    });

    return projects;
  } catch (error) {
    logger.error(`Failed to fetch projects for user ${userId}: ${error}`);
    throw error;
  }
});
