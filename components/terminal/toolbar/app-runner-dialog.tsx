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
}

export function AppRunnerDialog({
  open,
  onOpenChange,
  onConfirm,
}: AppRunnerDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#252526] border-[#3e3e42] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Prepare Deployment Files?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400 space-y-3" asChild>
            <div className="text-sm text-gray-400 space-y-3">
              <div>
                This will invoke the deployment skill in the selected directory by running:
                <br />
                <code className="bg-[#1e1e1e] px-1.5 py-0.5 rounded text-xs border border-[#3e3e42] mt-1 inline-block font-mono text-blue-400">
                  claude -p &quot;/fulling-deploy&quot;
                </code>
              </div>

              <div className="bg-[#1e1e1e]/50 rounded-md border border-[#3e3e42]/50 text-sm">
                <div className="p-3 space-y-2">
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Generate or reuse a Dockerfile for the current project</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Create a GitHub Actions workflow for image build and push</span>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Let the skill commit and push the generated files to GitHub</span>
                  </div>
                </div>

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
            Confirm & Run Skill
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
