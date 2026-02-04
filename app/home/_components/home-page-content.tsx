'use client'

import { useState } from 'react'
import { PageHeaderWithFilter } from './page-header-with-filter'
import { ProjectListClient } from './project-list-client'
import { ProjectStatus } from './types'

// Prisma Project type (from getProjects)
interface PrismaProject {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  updatedAt: Date
}

interface HomePageContentProps {
  projects: PrismaProject[]
}

export function HomePageContent({ projects }: HomePageContentProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | ProjectStatus>('ALL')

  return (
    <>
      <PageHeaderWithFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <ProjectListClient projects={projects} activeFilter={activeFilter} />
    </>
  )
}
