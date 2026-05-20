'use client';

import type { Sandbox } from '@prisma/client';

interface EditorPanelHostProps {
  sandbox: Sandbox | undefined;
}

export function EditorPanelHost({ sandbox }: EditorPanelHostProps) {
  if (!sandbox?.editorUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Editor is not available yet.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <iframe
        src={sandbox.editorUrl}
        className="h-full w-full border-0"
        title="Editor"
      />
    </div>
  );
}
