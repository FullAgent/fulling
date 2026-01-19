import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AppRunnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  sandboxUrl: string | null | undefined;
}

export function AppRunnerDialog({
  open,
  onOpenChange,
  onConfirm,
  sandboxUrl,
}: AppRunnerDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#252526] border-[#3e3e42] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Run Application & Keep Active?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400 space-y-3" asChild>
            <div className="text-sm text-gray-400 space-y-3">
              <div>
                This will build and start your application by running:
                <br />
                <code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded text-xs border border-[#3e3e42] mt-1 inline-block font-mono text-blue-400">
                  pnpm build && pnpm start
                </code>
              </div>

              <div className="bg-[#1e1e1e]/50 rounded-md border border-[#3e3e42]/50 text-sm">
                <div className="p-3 space-y-2">
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>App runs continuously in the background</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Remains active even if you leave this page</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>
                      Can be stopped anytime by clicking this button again
                    </span>
                  </div>
                </div>

                {sandboxUrl && (
                  <div className="px-3 pb-3 pt-2 border-t border-[#3e3e42]/30">
                    <div className="text-xs text-gray-500 mb-1">
                      Once running, your application will be available at:
                    </div>
                    <a
                      href={sandboxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#3794ff] hover:text-[#4fc1ff] break-all underline underline-offset-2 hover:underline-offset-4 transition-all block"
                    >
                      {sandboxUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-[#3e3e42] text-gray-300 hover:bg-[#37373d] hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[#007fd4] hover:bg-[#0060a0] text-white"
          >
            Confirm & Run
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
