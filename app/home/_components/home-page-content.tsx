'use client'

import { useState } from 'react'
import { PageHeaderWithFilter } from './page-header-with-filter'
import { ProjectList } from './project-list'
import { ProjectStatus } from '@prisma/client'
import type { ProjectWithRelations } from '@/lib/data/project'

interface HomePageContentProps {
  projects: ProjectWithRelations<{ sandboxes: true }>[]
}

export function HomePageContent({ projects }: HomePageContentProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | ProjectStatus>('ALL')

  return (
    <>
      <PageHeaderWithFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <ProjectList projects={projects} activeFilter={activeFilter} />
    </>
  )
}
