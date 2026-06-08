const AUTH_SESSION_STORAGE_KEY = "orbis-auth-session"
const AUTH_REMEMBER_SESSION_STORAGE_KEY = "orbis-auth-remember-session"

export const AUTH_SESSION_UPDATED_EVENT = "orbis-auth-session-updated"

function canUseBrowserStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  )
}

function getStoredAuthSession(storage) {
  try {
    const rawSession = storage.getItem(AUTH_SESSION_STORAGE_KEY)

    if (!rawSession) {
      return null
    }

    return normalizeAuthSessionPayload(JSON.parse(rawSession))
  } catch {
    return null
  }
}

function getAuthSessionStorageMode() {
  if (!canUseBrowserStorage()) {
    return null
  }

  try {
    if (window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)) {
      return "session"
    }

    if (window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)) {
      return "local"
    }
  } catch {}

  return null
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
    usuario: normalizeAuthUser(payload.usuario ?? payload.usuarioSemSenha ?? null),
  }
}

export function normalizeAuthUser(usuario) {
  if (!usuario || typeof usuario !== "object") {
    return null
  }

  return {
    ...usuario,
    id: usuario.id ?? null,
    nome: typeof usuario.nome === "string" ? usuario.nome : "",
    email: typeof usuario.email === "string" ? usuario.email : "",
    role: typeof usuario.role === "string" ? usuario.role : "",
    ativo: typeof usuario.ativo === "boolean" ? usuario.ativo : true,
    telefone: typeof usuario.telefone === "string" ? usuario.telefone : "",
    especialidade: typeof usuario.especialidade === "string" ? usuario.especialidade : "",
    fotoPerfil: typeof usuario.fotoPerfil === "string" ? usuario.fotoPerfil : "",
    caminhoFoto: typeof usuario.caminhoFoto === "string" ? usuario.caminhoFoto : "",
    criadoEm: typeof usuario.criadoEm === "string" ? usuario.criadoEm : null,
    atualizadoEm: typeof usuario.atualizadoEm === "string" ? usuario.atualizadoEm : null,
  }
}

function notifyAuthSessionUpdated() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT))
}

export function saveAuthSession(payload, options = {}) {
  const session = normalizeAuthSessionPayload(payload)
  const { remember } = options

  if (!session) {
    return null
  }

  if (!canUseBrowserStorage()) {
    return session
  }

  try {
    const shouldRemember =
      typeof remember === "boolean"
        ? remember
        : getAuthSessionStorageMode() !== "session"
    const targetStorage = shouldRemember ? window.localStorage : window.sessionStorage
    const staleStorage = shouldRemember ? window.sessionStorage : window.localStorage

    targetStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
    staleStorage.removeItem(AUTH_SESSION_STORAGE_KEY)

    if (typeof remember === "boolean") {
      window.localStorage.setItem(AUTH_REMEMBER_SESSION_STORAGE_KEY, remember ? "1" : "0")
    }
    window.localStorage.removeItem("orbis_user_name")
    window.localStorage.removeItem("orbis_user_email")
    notifyAuthSessionUpdated()
  } catch {}

  return session
}

export function getAuthSession() {
  if (!canUseBrowserStorage()) {
    return null
  }

  return getStoredAuthSession(window.sessionStorage) ?? getStoredAuthSession(window.localStorage)
}

export function isAuthSessionRemembered() {
  if (!canUseBrowserStorage()) {
    return false
  }

  try {
    return (
      window.localStorage.getItem(AUTH_REMEMBER_SESSION_STORAGE_KEY) === "1" &&
      Boolean(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY))
    )
  } catch {
    return false
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

  if (!session) {
    return null
  }

  if (!isAuthSessionValid(session)) {
    clearAuthSession()
    return null
  }

  return session
}

export function getAuthSessionUser() {
  return getAuthSession()?.usuario ?? null
}

export function updateAuthSessionUser(usuario) {
  const session = getAuthSession()
  const normalizedUser = normalizeAuthUser(usuario)

  if (!session || !normalizedUser || !canUseBrowserStorage()) {
    return null
  }

  const updatedSession = {
    ...session,
    usuario: normalizedUser,
  }

  try {
    const storageMode = getAuthSessionStorageMode()
    const targetStorage = storageMode === "session" ? window.sessionStorage : window.localStorage

    targetStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(updatedSession))
    window.localStorage.removeItem("orbis_user_name")
    window.localStorage.removeItem("orbis_user_email")
    notifyAuthSessionUpdated()
  } catch {
    return null
  }

  return updatedSession
}

export function clearAuthSession() {
  if (!canUseBrowserStorage()) {
    return
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_REMEMBER_SESSION_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  window.localStorage.removeItem("orbis_user_name")
  window.localStorage.removeItem("orbis_user_email")
  window.localStorage.removeItem("orbis-tecnicos")
  window.localStorage.removeItem("orbis-alertas")
  notifyAuthSessionUpdated()
}
