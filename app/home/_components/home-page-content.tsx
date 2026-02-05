'use client'

import { useState } from 'react'
import { PageHeaderWithFilter } from './page-header-with-filter'
import { ProjectListClient } from './project-list-client'
import { ProjectStatus } from './types'
import type { ProjectWithRelations } from '@/lib/data/project'

interface HomePageContentProps {
  projects: ProjectWithRelations<{ sandboxes: true }>[]
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
