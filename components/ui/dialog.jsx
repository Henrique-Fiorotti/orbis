"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  handleModalOverlayScroll,
  useControllableModalOpen,
  useModalScrollContainment,
  useModalScrollLock,
} from "@/components/ui/modal-behavior"
import { XIcon } from "lucide-react"

function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  modal = true,
  ...props
}) {
  const [currentOpen, handleOpenChange] = useControllableModalOpen({
    open,
    defaultOpen,
    onOpenChange,
  })

  useModalScrollLock(modal !== false && currentOpen)

  return (
    <DialogPrimitive.Root
      data-slot="dialog"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      modal={modal}
      {...props} />
  );
}

function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  onWheelCapture,
  onTouchMoveCapture,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      onWheelCapture={(event) => {
        onWheelCapture?.(event)
        if (!event.defaultPrevented) {
          handleModalOverlayScroll(event)
        }
      }}
      onTouchMoveCapture={(event) => {
        onTouchMoveCapture?.(event)
        if (!event.defaultPrevented) {
          handleModalOverlayScroll(event)
        }
      }}
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props} />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onOpenAutoFocus,
  tabIndex,
  onWheelCapture,
  onTouchStartCapture,
  onTouchMoveCapture,
  ...props
}) {
  const contentRef = React.useRef(null)
  const scrollContainment = useModalScrollContainment({
    onWheelCapture,
    onTouchStartCapture,
    onTouchMoveCapture,
  })

  const handleOpenAutoFocus = React.useCallback(
    (event) => {
      onOpenAutoFocus?.(event)

      if (event.defaultPrevented) {
        return
      }

      event.preventDefault()
      requestAnimationFrame(() => {
        contentRef.current?.focus({ preventScroll: true })
      })
    },
    [onOpenAutoFocus]
  )

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        tabIndex={tabIndex ?? -1}
        onOpenAutoFocus={handleOpenAutoFocus}
        onWheelCapture={scrollContainment.onWheelCapture}
        onTouchStartCapture={scrollContainment.onTouchStartCapture}
        onTouchMoveCapture={scrollContainment.onTouchMoveCapture}
        className={cn(
          "fixed top-1/2 left-1/2 z-[60] grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}>
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
