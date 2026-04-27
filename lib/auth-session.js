const AUTH_SESSION_STORAGE_KEY = "orbis-auth-session"

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function decodeBase64Url(value) {
  if (typeof window === "undefined" || typeof window.atob !== "function") {
    return null
  }

  try {
    const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/")
    const padding = "=".repeat((4 - (normalizedValue.length % 4)) % 4)
    return window.atob(`${normalizedValue}${padding}`)
  } catch {
    return null
  }
}

function parseJwtPayload(token) {
  if (typeof token !== "string") {
    return null
  }

  const [, payload] = token.split(".")

  if (!payload) {
    return null
  }

  const decodedPayload = decodeBase64Url(payload)

  if (!decodedPayload) {
    return null
  }

  try {
    return JSON.parse(decodedPayload)
  } catch {
    return null
  }
}

export function normalizeAuthSessionPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const accessToken = typeof payload.accessToken === "string" ? payload.accessToken : null

  if (!accessToken) {
    return null
  }

  return {
    accessToken,
    refreshToken: typeof payload.refreshToken === "string" ? payload.refreshToken : null,
    usuario: payload.usuario ?? payload.usuarioSemSenha ?? null,
  }
}

export function saveAuthSession(payload) {
  const session = normalizeAuthSessionPayload(payload)

  if (!session) {
    return null
  }

  if (!canUseBrowserStorage()) {
    return session
  }

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {}

  return session
}

export function getAuthSession() {
  if (!canUseBrowserStorage()) {
    return null
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

    if (!rawSession) {
      return null
    }

    return normalizeAuthSessionPayload(JSON.parse(rawSession))
  } catch {
    return null
  }
}

export function isAuthSessionValid(session = getAuthSession()) {
  if (!session?.accessToken) {
    return false
  }

  const payload = parseJwtPayload(session.accessToken)

  if (!payload) {
    return false
  }

  if (typeof payload.exp !== "number") {
    return true
  }

  return payload.exp * 1000 > Date.now()
}

export function getValidAuthSession() {
  const session = getAuthSession()

  if (!isAuthSessionValid(session)) {
    clearAuthSession()
    return null
  }

  return session
}

export function clearAuthSession() {
  if (!canUseBrowserStorage()) {
    return
  }

    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    window.localStorage.removeItem("orbis_user_name")
    window.localStorage.removeItem("orbis_user_email")
    window.localStorage.removeItem("orbis-tecnicos")
    window.localStorage.removeItem("orbis-alertas")
  
}
