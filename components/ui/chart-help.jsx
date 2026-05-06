"use client"

import * as React from "react"
import { CircleHelpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function ChartHelp({ children, className }) {
  const [open, setOpen] = React.useState(false)
  const contentId = React.useId()
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    if (!open) {
      return undefined
    }

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative flex justify-end", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-8 rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Explicar gráfico"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <CircleHelpIcon className="size-4" />
      </Button>
      {open ? (
        <div
          id={contentId}
          role="note"
          className="absolute right-0 bottom-10 z-50 w-[min(270px,calc(100vw-2rem))] rounded-lg border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export { ChartHelp }
