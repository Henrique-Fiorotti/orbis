"use client"

import * as React from "react"
import { RefreshCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const MIN_SPIN_DURATION = 500

export function RefreshTooltipButton({
  className = "cursor-pointer bg-[#5E17EB] text-white shadow-sm hover:bg-[#4c11c4] hover:text-white dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9]",
  iconClassName = "size-4",
  label = "Atualizar",
  disabled,
  onClick,
  size = "icon-sm",
  successMessage = "Atualização concluída.",
  variant = "default",
  ...props
}) {
  const [spinning, setSpinning] = React.useState(false)

  async function handleClick(event) {
    if (disabled || spinning) {
      return
    }

    setSpinning(true)
    const startedAt = Date.now()

    try {
      await onClick?.(event)
      toast.success(successMessage)
    } finally {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(MIN_SPIN_DURATION - elapsed, 0)

      window.setTimeout(() => setSpinning(false), remaining)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className={className}
          disabled={disabled || spinning}
          onClick={handleClick}
          size={size}
          type="button"
          variant={variant}
          {...props}
        >
          <RefreshCcwIcon className={cn(iconClassName, spinning && "animate-spin")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="mb-0!">{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
