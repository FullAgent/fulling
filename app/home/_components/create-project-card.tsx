'use client'

import { useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { cn } from '@/lib/utils'
import CreateProjectDialog from '@/components/dialog/create-project-dialog'

export function CreateProjectCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          'group bg-card/30 border border-dashed border-border rounded-xl',
          'flex flex-col items-center justify-center p-8',
          'hover:bg-card/50 hover:border-primary/50',
          'transition-all cursor-pointer h-full min-h-[280px]'
        )}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full bg-card border border-border',
            'flex items-center justify-center',
            'group-hover:scale-110 transition-transform duration-300',
            'mb-4 shadow-lg group-hover:shadow-primary/20'
          )}
        >
          <MdAdd className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="text-lg font-bold font-display text-white mb-2">
          Create New Project
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-[200px]">
          Start from scratch or use one of our templates.
        </p>
      </button>

      <CreateProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}
