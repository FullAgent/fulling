'use client'

import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ProjectStatus } from '@prisma/client'

type FilterStatus = 'ALL' | ProjectStatus

interface PageHeaderWithFilterProps {
  activeFilter: FilterStatus
  onFilterChange: (filter: FilterStatus) => void
}

const filters: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Stopped', value: 'STOPPED' },
]

export function PageHeaderWithFilter({ activeFilter, onFilterChange }: PageHeaderWithFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          My Projects
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor your full stack apps and deployments.
        </p>
      </div>
      <ToggleGroup
        type="single"
        value={activeFilter}
        onValueChange={(value) => value && onFilterChange(value as FilterStatus)}
        className="flex bg-sidebar p-1 rounded-lg border border-border"
        spacing={1}
      >
        {filters.map((filter) => (
          <ToggleGroupItem
            key={filter.value}
            value={filter.value}
            className={cn(
              'px-4 py-1.5 text-xs font-bold font-heading rounded border-0 shadow-none',
              'text-muted-foreground hover:text-white hover:bg-transparent',
              'data-[state=on]:bg-accent data-[state=on]:text-foreground data-[state=on]:shadow-sm',
              'transition-colors duration-200'
            )}
          >
            {filter.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
