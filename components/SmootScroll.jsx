'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

const TOUR_SCROLL_LOCK_CHANGE = 'tour.scrollLockChange'

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function handleScrollLockChange(event) {
      if (event.detail?.locked) {
        lenis.stop()
        return
      }

      lenis.start()
    }

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    window.addEventListener(TOUR_SCROLL_LOCK_CHANGE, handleScrollLockChange)
    requestAnimationFrame(raf)

    return () => {
      window.removeEventListener(TOUR_SCROLL_LOCK_CHANGE, handleScrollLockChange)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
