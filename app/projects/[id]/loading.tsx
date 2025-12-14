import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="h-screen flex flex-col text-foreground overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Primary Sidebar Skeleton */}
        <div className="w-[50px] border-r border-border bg-card flex flex-col items-center py-4 gap-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        {/* Project Sidebar Skeleton */}
        <div className="w-60 border-r border-border bg-card/50 flex flex-col">
          <div className="h-12 border-b border-border flex items-center px-4">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        {/* Main Content Area Skeleton */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-background">
          <div className="h-14 border-b border-border flex items-center px-6">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar Skeleton */}
      <div className="h-6 border-t border-border bg-card flex items-center px-2 gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
