import {
  normalizeRole,
  normalizeUserRecord,
  pickFirstDefined,
  pickFirstString,
} from "@/lib/user-models"

const AUTH_SESSION_STORAGE_KEY = "orbis-auth-session"
const AUTH_SESSION_CHANGE_EVENT = "orbis-auth-session-change"
const ACCESS_TOKEN_COOKIE_KEY = "accessToken"
const REFRESH_TOKEN_COOKIE_KEY = "refreshToken"
const COOKIE_EXPIRATION_DAYS = 7

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function canUseDocumentCookies() {
  return typeof document !== "undefined"
}

function decodeBase64Url(value) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = "=".repeat((4 - (normalizedValue.length % 4)) % 4)
  const encodedValue = `${normalizedValue}${padding}`

  try {
    if (typeof globalThis.atob === "function") {
      return globalThis.atob(encodedValue)
    }

    if (typeof Buffer !== "undefined") {
      return Buffer.from(encodedValue, "base64").toString("utf-8")
    }
  } catch {}

  return null
}

export function parseJwtPayload(token) {
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

function dispatchAuthSessionChange() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGE_EVENT))
}

function getBrowserCookie(name) {
  if (!canUseDocumentCookies()) {
    return null
  }

  const cookieEntries = document.cookie ? document.cookie.split("; ") : []
  const matchedEntry = cookieEntries.find((entry) => entry.startsWith(`${name}=`))

  if (!matchedEntry) {
    return null
  }

  const [, rawValue = ""] = matchedEntry.split("=")

  try {
    return decodeURIComponent(rawValue)
  } catch {
    return rawValue
  }
}

function setBrowserCookie(name, value, { expiresInDays = COOKIE_EXPIRATION_DAYS } = {}) {
  if (!canUseDocumentCookies() || typeof value !== "string" || !value.trim()) {
    return
  }

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""

  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiresAt.toUTCString()}; path=/; SameSite=Lax${secure}`
}

function removeBrowserCookie(name) {
  if (!canUseDocumentCookies()) {
    return
  }

  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secure}`
}

function readSnapshot() {
  if (!canUseBrowserStorage()) {
    return null
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

    if (!rawSession) {
      return null
    }

    const parsedSnapshot = JSON.parse(rawSession)
    const role = normalizeRole(parsedSnapshot?.role ?? parsedSnapshot?.usuario?.role)
    const usuario = normalizeUserRecord(parsedSnapshot?.usuario, { role })

    return { role, usuario }
  } catch {
    return null
  }
}

function writeSnapshot(session) {
  if (!canUseBrowserStorage() || !session?.usuario) {
    return
  }

  try {
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        role: session.role,
        usuario: session.usuario,
      })
    )
  } catch {}
}

function resolveTokenClaims(accessToken) {
  const tokenPayload = parseJwtPayload(accessToken)
  const role = normalizeRole(
    pickFirstDefined(
      tokenPayload?.role,
      tokenPayload?.roles,
      tokenPayload?.authorities,
      tokenPayload?.scope
    )
  )

  return {
    tokenPayload,
    role,
    usuario: normalizeUserRecord(tokenPayload, {
      id: pickFirstString(tokenPayload?.sub),
      nome: pickFirstString(tokenPayload?.name, tokenPayload?.nome),
      email: pickFirstString(tokenPayload?.email),
      role,
    }),
  }
}

export function getAuthTokens() {
  return {
    accessToken: getBrowserCookie(ACCESS_TOKEN_COOKIE_KEY),
    refreshToken: getBrowserCookie(REFRESH_TOKEN_COOKIE_KEY),
  }
}

export function normalizeAuthSessionPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const accessToken = pickFirstString(payload.accessToken, payload.token, payload.jwt)

  if (!accessToken) {
    return null
  }

  const refreshToken = pickFirstString(payload.refreshToken, payload.refresh, payload.refresh_token) || null
  const { role: roleFromToken, usuario: usuarioFromToken } = resolveTokenClaims(accessToken)
  const rawUsuario =
    payload.usuario ??
    payload.usuarioSemSenha ??
    payload.user ??
    payload.usuarioLogado ??
    payload.data?.usuario ??
    null
  const role = normalizeRole(
    pickFirstDefined(rawUsuario?.role, payload.role, payload.cargo, roleFromToken),
    roleFromToken ?? "TECNICO"
  )
  const usuario = normalizeUserRecord(rawUsuario ?? usuarioFromToken, {
    ...usuarioFromToken,
    role,
  })

  return {
    accessToken,
    refreshToken,
    role,
    usuario,
  }
}

export function saveAuthTokens(payload) {
  if (!payload || typeof payload !== "object") {
    return getAuthTokens()
  }

  const accessToken = pickFirstString(payload.accessToken, payload.token, payload.jwt)
  const refreshToken = pickFirstString(payload.refreshToken, payload.refresh, payload.refresh_token)

  if (accessToken) {
    setBrowserCookie(ACCESS_TOKEN_COOKIE_KEY, accessToken)
  }

  if (refreshToken) {
    setBrowserCookie(REFRESH_TOKEN_COOKIE_KEY, refreshToken)
  }

  return getAuthTokens()
}

export function updateAuthSessionTokens(payload) {
  const currentSession = getAuthSession()
  const nextSession = normalizeAuthSessionPayload({
    accessToken:
      pickFirstString(payload?.accessToken, payload?.token, payload?.jwt) || currentSession?.accessToken,
    refreshToken:
      pickFirstString(payload?.refreshToken, payload?.refresh, payload?.refresh_token) ||
      currentSession?.refreshToken,
    usuario: currentSession?.usuario,
    role: currentSession?.role,
  })

  if (!nextSession) {
    return null
  }

  saveAuthTokens(nextSession)
  writeSnapshot(nextSession)
  dispatchAuthSessionChange()

  return nextSession
}

export function saveAuthSession(payload) {
  const session = normalizeAuthSessionPayload(payload)

  if (!session) {
    return null
  }

  saveAuthTokens(session)
  writeSnapshot(session)
  dispatchAuthSessionChange()

  return session
}

export function getAuthSession() {
  const { accessToken, refreshToken } = getAuthTokens()

  if (!accessToken) {
    return null
  }

  const snapshot = readSnapshot()
  const { role: roleFromToken, usuario: usuarioFromToken } = resolveTokenClaims(accessToken)
  const role = normalizeRole(snapshot?.role ?? snapshot?.usuario?.role ?? roleFromToken, roleFromToken ?? "TECNICO")
  const usuario = normalizeUserRecord(snapshot?.usuario ?? usuarioFromToken, {
    ...usuarioFromToken,
    role,
  })

  return {
    accessToken,
    refreshToken,
    role,
    usuario,
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

  if (!session?.accessToken) {
    clearAuthSession()
    return null
  }

  if (!isAuthSessionValid(session) && !session.refreshToken) {
    clearAuthSession()
    return null
  }

  return session
}

export function getAuthRole(session = getAuthSession()) {
  return normalizeRole(session?.role, "TECNICO")
}

export function isAdminSession(session = getAuthSession()) {
  return getAuthRole(session) === "ADMIN"
}

export function isTecnicoSession(session = getAuthSession()) {
  return getAuthRole(session) === "TECNICO"
}

export function subscribeToAuthSessionChange(callback) {
  if (typeof window === "undefined") {
    return () => {}
  }

  function handleSessionChange() {
    callback(getAuthSession())
  }

  function handleStorageChange(event) {
    if (event.key && event.key !== AUTH_SESSION_STORAGE_KEY) {
      return
    }

    handleSessionChange()
  }

  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, handleSessionChange)
  window.addEventListener("storage", handleStorageChange)

  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, handleSessionChange)
    window.removeEventListener("storage", handleStorageChange)
  }
}

export function clearAuthSession() {
  removeBrowserCookie(ACCESS_TOKEN_COOKIE_KEY)
  removeBrowserCookie(REFRESH_TOKEN_COOKIE_KEY)

  if (canUseBrowserStorage()) {
    try {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    } catch {}
  }

  dispatchAuthSessionChange()
}
