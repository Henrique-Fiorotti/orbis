"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const CODE_LENGTH = 6

function normalizeCode(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, CODE_LENGTH)
}

function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  idPrefix = "otp-code",
  className,
  "aria-label": ariaLabel = "Código de segurança",
}) {
  const refs = React.useRef([])
  const digits = normalizeCode(value).padEnd(CODE_LENGTH, " ").split("")

  function updateValue(nextValue, focusIndex) {
    onChange?.(normalizeCode(nextValue))

    if (typeof focusIndex === "number") {
      window.requestAnimationFrame(() => refs.current[focusIndex]?.focus())
    }
  }

  function setDigit(index, rawValue) {
    const nextDigits = normalizeCode(rawValue)

    if (!nextDigits) {
      const current = normalizeCode(value).split("")
      current.splice(index, 1)
      updateValue(current.join(""), Math.max(index - 1, 0))
      return
    }

    const current = normalizeCode(value).padEnd(CODE_LENGTH, " ").split("")

    nextDigits.split("").forEach((digit, offset) => {
      if (index + offset < CODE_LENGTH) {
        current[index + offset] = digit
      }
    })

    const nextFocus = Math.min(index + nextDigits.length, CODE_LENGTH - 1)
    updateValue(current.join("").replace(/\s/g, ""), nextFocus)
  }

  function handleKeyDown(event, index) {
    if (event.key === "Backspace" && !digits[index].trim() && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
      return
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
      return
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  function handlePaste(event, index) {
    const pasted = normalizeCode(event.clipboardData.getData("text"))

    if (!pasted) {
      return
    }

    event.preventDefault()
    setDigit(index, pasted)
  }

  return (
    <div className={cn("flex w-full items-center justify-between gap-2", className)}>
      {digits.map((digit, index) => (
        <React.Fragment key={`${idPrefix}-${index}`}>
          <input
            ref={(node) => {
              refs.current[index] = node
            }}
            id={`${idPrefix}-${index}`}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`${ariaLabel} ${index + 1}`}
            disabled={disabled}
            value={digit.trim()}
            maxLength={1}
            placeholder="0"
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={(event) => handlePaste(event, index)}
            className="h-16 min-w-0 flex-1 rounded-lg border border-input bg-background text-center text-4xl font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 sm:h-20"
          />
        </React.Fragment>
      ))}
    </div>
  )
}

export { OtpCodeInput, CODE_LENGTH }
