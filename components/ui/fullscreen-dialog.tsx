"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function FullScreenDialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="fullscreen-dialog" {...props} />
}

function FullScreenDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger data-slot="fullscreen-dialog-trigger" {...props} />
  )
}

function FullScreenDialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return (
    <DialogPrimitive.Portal data-slot="fullscreen-dialog-portal" {...props} />
  )
}

function FullScreenDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="fullscreen-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        // Simulate pressing Escape key to close the dialog
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }}
      {...props}
    />
  )
}

function FullScreenDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <FullScreenDialogPortal>
      <FullScreenDialogOverlay />
      <DialogPrimitive.Content
        data-slot="fullscreen-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[500px] translate-x-[-50%] translate-y-[-50%] gap-8 rounded-2xl border p-8 shadow-2xl duration-200",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </FullScreenDialogPortal>
  )
}

function FullScreenDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="fullscreen-dialog-header"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function FullScreenDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="fullscreen-dialog-footer"
      className={cn("grid grid-cols-2 gap-3 pt-2", className)}
      {...props}
    />
  )
}

function FullScreenDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="fullscreen-dialog-title"
      className={cn(
        "text-2xl font-[family-name:var(--font-heading)] font-bold tracking-tight leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FullScreenDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="fullscreen-dialog-description"
      className={cn("text-muted-foreground text-sm leading-relaxed", className)}
      {...props}
    />
  )
}

function FullScreenDialogClose({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="fullscreen-dialog-close"
      className={cn(
        "px-6 py-3.5 rounded-xl border border-border bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white font-medium text-sm font-[family-name:var(--font-heading)] tracking-wide transition-all",
        className
      )}
      {...props}
    />
  )
}

function FullScreenDialogAction({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "destructive"
}) {
  return (
    <button
      data-slot="fullscreen-dialog-action"
      className={cn(
        "px-6 py-3.5 rounded-xl text-white font-bold text-sm font-[family-name:var(--font-heading)] tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
        variant === "destructive"
          ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
          : "bg-primary hover:bg-primary/90",
        className
      )}
      {...props}
    />
  )
}

export {
  FullScreenDialog,
  FullScreenDialogTrigger,
  FullScreenDialogPortal,
  FullScreenDialogOverlay,
  FullScreenDialogContent,
  FullScreenDialogHeader,
  FullScreenDialogFooter,
  FullScreenDialogTitle,
  FullScreenDialogDescription,
  FullScreenDialogClose,
  FullScreenDialogAction,
}
