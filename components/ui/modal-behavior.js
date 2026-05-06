"use client"

import * as React from "react"

const SCROLL_LOCK_CHANGE = "tour.scrollLockChange"

let scrollLockCount = 0
let previousBodyOverflow = ""
let previousBodyPaddingRight = ""
let previousBodyOverscrollBehavior = ""
let previousHtmlOverflow = ""
let previousHtmlOverscrollBehavior = ""

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth
}

function lockDocumentScroll() {
  if (typeof document === "undefined") {
    return () => {}
  }

  const body = document.body
  const html = document.documentElement

  if (scrollLockCount === 0) {
    previousBodyOverflow = body.style.overflow
    previousBodyPaddingRight = body.style.paddingRight
    previousBodyOverscrollBehavior = body.style.overscrollBehavior
    previousHtmlOverflow = html.style.overflow
    previousHtmlOverscrollBehavior = html.style.overscrollBehavior

    const scrollbarWidth = getScrollbarWidth()
    body.style.overflow = "hidden"
    body.style.overscrollBehavior = "none"
    html.style.overflow = "hidden"
    html.style.overscrollBehavior = "none"

    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }

    window.dispatchEvent(new CustomEvent(SCROLL_LOCK_CHANGE, { detail: { locked: true } }))
  }

  scrollLockCount += 1

  return () => {
    scrollLockCount = Math.max(0, scrollLockCount - 1)

    if (scrollLockCount === 0) {
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousBodyPaddingRight
      body.style.overscrollBehavior = previousBodyOverscrollBehavior
      html.style.overflow = previousHtmlOverflow
      html.style.overscrollBehavior = previousHtmlOverscrollBehavior
      window.dispatchEvent(new CustomEvent(SCROLL_LOCK_CHANGE, { detail: { locked: false } }))
    }
  }
}

function useControllableModalOpen({ open, defaultOpen, onOpenChange }) {
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = React.useState(Boolean(defaultOpen))

  const currentOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange]
  )

  return [Boolean(currentOpen), handleOpenChange]
}

function useModalScrollLock(locked) {
  React.useEffect(() => {
    if (!locked) {
      return undefined
    }

    return lockDocumentScroll()
  }, [locked])
}

function canScrollElement(element, deltaY) {
  if (!(element instanceof HTMLElement)) {
    return false
  }

  const style = window.getComputedStyle(element)
  const overflowY = style.overflowY
  const allowsScroll = overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay"

  if (!allowsScroll || element.scrollHeight <= element.clientHeight) {
    return false
  }

  if (deltaY < 0) {
    return element.scrollTop > 0
  }

  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1
  }

  return false
}

function canScrollWithin(target, boundary, deltaY) {
  if (typeof window === "undefined" || !boundary || deltaY === 0) {
    return false
  }

  let element = target instanceof Element ? target : boundary

  while (element) {
    if (canScrollElement(element, deltaY)) {
      return true
    }

    if (element === boundary) {
      break
    }

    element = element.parentElement
  }

  return false
}

function useModalScrollContainment({
  onWheelCapture,
  onTouchStartCapture,
  onTouchMoveCapture,
} = {}) {
  const lastTouchYRef = React.useRef(null)

  const handleWheelCapture = React.useCallback(
    (event) => {
      onWheelCapture?.(event)

      if (event.defaultPrevented) {
        return
      }

      event.stopPropagation()

      if (!canScrollWithin(event.target, event.currentTarget, event.deltaY)) {
        event.preventDefault()
      }
    },
    [onWheelCapture]
  )

  const handleTouchStartCapture = React.useCallback(
    (event) => {
      onTouchStartCapture?.(event)
      lastTouchYRef.current = event.touches?.[0]?.clientY ?? null
    },
    [onTouchStartCapture]
  )

  const handleTouchMoveCapture = React.useCallback(
    (event) => {
      onTouchMoveCapture?.(event)

      if (event.defaultPrevented) {
        return
      }

      const currentY = event.touches?.[0]?.clientY ?? null
      const lastY = lastTouchYRef.current
      lastTouchYRef.current = currentY

      if (currentY === null || lastY === null) {
        return
      }

      const deltaY = lastY - currentY
      event.stopPropagation()

      if (!canScrollWithin(event.target, event.currentTarget, deltaY)) {
        event.preventDefault()
      }
    },
    [onTouchMoveCapture]
  )

  return {
    onWheelCapture: handleWheelCapture,
    onTouchStartCapture: handleTouchStartCapture,
    onTouchMoveCapture: handleTouchMoveCapture,
  }
}

function handleModalOverlayScroll(event) {
  event.preventDefault()
  event.stopPropagation()
}

export {
  handleModalOverlayScroll,
  useControllableModalOpen,
  useModalScrollContainment,
  useModalScrollLock,
}
