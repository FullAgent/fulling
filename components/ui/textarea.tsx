import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--radius-inputs)] border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors aria-invalid:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:text-[var(--color-mist)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
