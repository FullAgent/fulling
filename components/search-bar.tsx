'use client'

import { useState } from 'react'
import { MdAdd, MdSearch } from 'react-icons/md'

import CreateProjectDialog from '@/components/dialog/create-project-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'

export function SearchBar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
        {/* 搜索框 */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>

            <Input
              className="block w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-white placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all font-[family-name:var(--font-heading)]"
              placeholder="Search projects or type '/' for commands..."
              type="text"
            />

            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-border rounded text-[10px] font-mono bg-background">
                ⌘K
              </Kbd>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4 ml-6">
          <div className="flex items-center shadow-sm rounded-lg overflow-hidden">
            <Button variant="secondary" className="rounded-r-none border-r-0 focus:z-10">
              Import
            </Button>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="rounded-l-none font-bold font-[family-name:var(--font-heading)] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] focus:z-10"
            >
              <MdAdd className="w-[18px] h-[18px]" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <CreateProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}
