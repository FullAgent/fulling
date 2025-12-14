import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectCardSkeleton() {
  return (
    <Card className="h-full border border-border rounded-md p-5 flex flex-col gap-4">
      <CardHeader className="px-0 pt-0 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 w-full">
            <Skeleton className="h-6 w-3/4" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        
        <div className="mt-2 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>

      <div className="border-t border-border" />

      <CardFooter className="flex items-center justify-between px-0">
        <div className="flex items-center gap-x-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      </CardFooter>
    </Card>
  );
}
