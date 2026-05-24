"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { setSmoothScrollLock } from "@/lib/scroll-lock"

const MOBILE_SHEET_QUERY = "(max-width: 640px)"

function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}) {
  const lockId = React.useId()
  const isControlled = open !== undefined
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(Boolean(defaultOpen))
  const currentOpen = isControlled ? open : uncontrolledOpen

  React.useEffect(() => {
    setSmoothScrollLock(lockId, Boolean(currentOpen))

    return () => setSmoothScrollLock(lockId, false)
  }, [lockId, currentOpen])

  function handleOpenChange(nextOpen) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  return (
    <SheetPrimitive.Root
      data-slot="sheet"
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

function SheetTrigger({
  ...props
}) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}) {
  return <SheetPrimitive.Close className="cursor-pointer" data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-[49] bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props} />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  mobileSide,
  showCloseButton = true,
  onWheel,
  onTouchMove,
  style,
  ...props
}) {
  const [useMobileSide, setUseMobileSide] = React.useState(false)
  const effectiveSide = mobileSide && useMobileSide ? mobileSide : side
  const closeRef = React.useRef(null)
  const dragStartYRef = React.useRef(0)
  const [dragY, setDragY] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const isBottomSheet = effectiveSide === "bottom"

  React.useEffect(() => {
    if (!mobileSide) {
      setUseMobileSide(false)
      return undefined
    }

    const mediaQuery = window.matchMedia(MOBILE_SHEET_QUERY)
    const handleChange = () => setUseMobileSide(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [mobileSide])

  React.useEffect(() => {
    if (!isBottomSheet) {
      setDragY(0)
      setIsDragging(false)
    }
  }, [isBottomSheet])

  function handleWheel(event) {
    onWheel?.(event)
    event.stopPropagation()
  }

  function handleTouchMove(event) {
    onTouchMove?.(event)
    event.stopPropagation()
  }

  function handleDragStart(event) {
    if (!isBottomSheet) {
      return
    }

    dragStartYRef.current = event.clientY
    setIsDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function handleDragMove(event) {
    if (!isDragging || !isBottomSheet) {
      return
    }

    setDragY(Math.max(event.clientY - dragStartYRef.current, 0))
  }

  function handleDragEnd(event) {
    if (!isDragging || !isBottomSheet) {
      return
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setIsDragging(false)

    if (dragY > 80) {
      setDragY(0)
      closeRef.current?.click()
      return
    }

    setDragY(0)
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={effectiveSide}
        className={cn(
          "group/sheet-content fixed z-50 flex flex-col gap-4 bg-background bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-0 data-[side=bottom]:h-[100dvh] data-[side=bottom]:max-h-[100dvh] data-[side=bottom]:overflow-hidden data-[side=bottom]:border-0 data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:max-h-[92dvh] data-[side=top]:overflow-hidden data-[side=top]:rounded-b-xl data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10",
          className
        )}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        style={{
          ...style,
          transform: dragY > 0 ? `translateY(${dragY}px)` : style?.transform,
          transition: isDragging ? "none" : style?.transition,
        }}
        {...props}>
        {isBottomSheet ? (
          <SheetPrimitive.Close asChild>
            <button ref={closeRef} type="button" className="sr-only" tabIndex={-1}>
              Fechar painel
            </button>
          </SheetPrimitive.Close>
        ) : null}
        <div
          className="mx-auto mt-4 hidden h-5 w-28 shrink-0 touch-none cursor-grab items-center justify-center rounded-full active:cursor-grabbing group-data-[side=bottom]/sheet-content:flex"
          role="button"
          tabIndex={isBottomSheet ? 0 : -1}
          aria-label="Arraste para baixo para fechar"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <span className="block h-1 w-[100px] rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/45" />
        </div>
        {children}
        {showCloseButton && !isBottomSheet && (
          <SheetPrimitive.Close className="cursor-pointer" data-slot="sheet-close" asChild>
            <Button variant="ghost" className="absolute top-3 right-3 cursor-pointer" size="icon-sm">
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4 bg-gradient-to-b from-popover to-popover/80", className)}
      {...props} />
  );
}

function SheetFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props} />
  );
}

function SheetTitle({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-medium text-foreground", className)}
      {...props} />
  );
}

function SheetDescription({
  className,
  ...props
}) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props} />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
