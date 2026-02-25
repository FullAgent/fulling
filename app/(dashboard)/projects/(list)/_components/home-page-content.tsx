'use client'

import { useEffect, useState } from 'react'
import { ProjectStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'

import type { ProjectWithRelations } from '@/lib/data/project'

import { PageHeaderWithFilter } from './page-header-with-filter'
import { ProjectList } from './project-list'

const REFRESH_INTERVAL_MS = 3000

interface HomePageContentProps {
  projects: ProjectWithRelations<{ sandboxes: true }>[]
}

export function HomePageContent({ projects }: HomePageContentProps) {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<'ALL' | ProjectStatus>('ALL')

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [router])

  return (
    <>
      <PageHeaderWithFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <ProjectList projects={projects} activeFilter={activeFilter} />
    </>
  )
}
