'use client';

import { useState } from 'react';
import { MdAdd } from 'react-icons/md';

import CreateProjectDialog from '@/components/dialog/create-project-dialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function EmptyProjectCard() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <Card 
        className={cn(
          "group bg-card border border-dashed border-border rounded-md p-5",
          "hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 cursor-pointer",
          "flex flex-col items-center justify-center gap-3 h-full min-h-[180px]",
          "text-muted-foreground hover:text-primary hover:bg-primary/5"
        )}
        onClick={() => setCreateModalOpen(true)}
      >
        <div className="w-12 h-12 rounded-full bg-secondary group-hover:bg-primary/20 flex items-center justify-center transition-colors">
          <MdAdd size={24} />
        </div>
        <span className="font-medium">Create new project</span>
      </Card>

      <CreateProjectDialog open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
}
