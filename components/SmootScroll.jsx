'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

import { useOptionalDashboardPreferences } from '@/components/context/dashboard-preferences-context'
import { SMOOTH_SCROLL_LOCK_CHANGE } from '@/lib/scroll-lock'

const TOUR_SCROLL_LOCK_CHANGE = 'tour.scrollLockChange'

export default function SmoothScroll({ children }) {
  const dashboardPreferences = useOptionalDashboardPreferences()
  const smoothScrollEnabled = dashboardPreferences?.preferences.smoothScrollEnabled ?? true

  useEffect(() => {
    if (!smoothScrollEnabled) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const connection = navigator.connection

    if (prefersReducedMotion || connection?.saveData) {
      return
    }

    let lenis = null
    let rafId = 0
    let idleId = 0
    const lockSources = new Set()
    let locked = false

    const startLenis = () => {
      if (lenis) return

      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        allowNestedScroll: true,
      })

      if (locked) {
        lenis.stop()
      }

      const raf = (time) => {
        lenis?.raf(time)
        rafId = requestAnimationFrame(raf)
      }

      rafId = requestAnimationFrame(raf)
      detachInteractionListeners()
    }

    const handleScrollLockChange = (event) => {
      const source = event.detail?.source || event.type
      const sourceLocked =
        typeof event.detail?.sourceLocked === 'boolean'
          ? event.detail.sourceLocked
          : Boolean(event.detail?.locked)

      if (sourceLocked) {
        lockSources.add(source)
      } else {
        lockSources.delete(source)
      }

      locked = lockSources.size > 0

      if (!lenis) return

      if (locked) {
        lenis.stop()
        return
      }

      lenis.start()
    }

    const interactionEvents = [
      ['wheel', { passive: true }],
      ['touchstart', { passive: true }],
      ['keydown', undefined],
    ]

    const attachInteractionListeners = () => {
      interactionEvents.forEach(([eventName, options]) => {
        window.addEventListener(eventName, startLenis, options)
      })
    }

    const detachInteractionListeners = () => {
      interactionEvents.forEach(([eventName, options]) => {
        window.removeEventListener(eventName, startLenis, options)
      })
    }

    attachInteractionListeners()
    window.addEventListener(TOUR_SCROLL_LOCK_CHANGE, handleScrollLockChange)
    window.addEventListener(SMOOTH_SCROLL_LOCK_CHANGE, handleScrollLockChange)

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(startLenis, { timeout: 1200 })
    } else {
      idleId = window.setTimeout(startLenis, 250)
    }

    return () => {
      detachInteractionListeners()
      window.removeEventListener(TOUR_SCROLL_LOCK_CHANGE, handleScrollLockChange)
      window.removeEventListener(SMOOTH_SCROLL_LOCK_CHANGE, handleScrollLockChange)

      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId)
      } else {
        window.clearTimeout(idleId)
      }

      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      lenis?.destroy()
    }
  }, [smoothScrollEnabled])

  return <>{children}</>
}
