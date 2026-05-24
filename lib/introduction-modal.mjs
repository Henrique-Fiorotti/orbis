export const DASHBOARD_INTRODUCTION_MODAL_OPEN_EVENT = "orbis-dashboard-introduction-open"
export const INTRODUCTION_VIDEO_SRC = "/orbis-introduction-modal.mp4"

export function getIntroductionSeenStorageKey(user) {
  const id = user?.id

  if (id !== undefined && id !== null && String(id).trim()) {
    return `orbis:introduction-modal-seen:${String(id).trim()}`
  }

  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : ""

  return `orbis:introduction-modal-seen:${email || "anonymous"}`
}
