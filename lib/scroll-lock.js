export const SMOOTH_SCROLL_LOCK_CHANGE = "orbis.smoothScrollLockChange"

const activeLocks = new Set()

export function isSmoothScrollLocked() {
  return activeLocks.size > 0
}

export function setSmoothScrollLock(source, locked) {
  if (typeof window === "undefined") {
    return
  }

  if (locked) {
    activeLocks.add(source)
  } else {
    activeLocks.delete(source)
  }

  window.dispatchEvent(
    new CustomEvent(SMOOTH_SCROLL_LOCK_CHANGE, {
      detail: {
        locked: activeLocks.size > 0,
        sourceLocked: locked,
        source,
      },
    })
  )
}
