export function runAfterCurrentOverlayCloses(callback) {
  if (typeof window === "undefined") {
    callback()
    return
  }

  window.setTimeout(callback, 0)
}
