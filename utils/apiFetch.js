import { clearAuthSession, getAuthTokens, updateAuthSessionTokens } from "@/lib/auth-session"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://orbis-5hnm.onrender.com"
const REFRESH_ENDPOINT = "/auth/refresh"

function resolveUrl(endpoint) {
  return /^https?:\/\//i.test(endpoint) ? endpoint : `${API_URL}${endpoint}`
}

function shouldSerializeJsonBody(body) {
  if (!body || typeof body !== "object") {
    return false
  }

  if (
    (typeof FormData !== "undefined" && body instanceof FormData) ||
    (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer)
  ) {
    return false
  }

  return true
}

async function parseResponsePayload(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null)
  }

  const text = await response.text().catch(() => "")
  return text || null
}

function createApiError(status, payload) {
  const fallbackMessage =
    status === 401
      ? "Sua sessao expirou. Faca login novamente."
      : `Erro ${status} ao comunicar com a API.`

  const message =
    typeof payload === "string" && payload.trim()
      ? payload.trim()
      : payload?.mensagem || payload?.message || payload?.erro || fallbackMessage

  const error = new Error(message)
  error.status = status
  error.payload = payload
  return error
}

function buildHeaders(headers, accessToken, shouldSendJsonBody) {
  const nextHeaders = new Headers(headers || {})

  if (shouldSendJsonBody && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json")
  }

  if (accessToken) {
    nextHeaders.set("Authorization", `Bearer ${accessToken}`)
  }

  return nextHeaders
}

async function performFetch(url, options) {
  const response = await fetch(url, options)
  const payload = await parseResponsePayload(response)
  return { response, payload }
}

async function refreshBrowserSession(refreshToken) {
  if (typeof window === "undefined" || !refreshToken) {
    return null
  }

  const refreshPayloads = [{ refreshToken }, refreshToken]

  for (const payload of refreshPayloads) {
    const { response, payload: responsePayload } = await performFetch(resolveUrl(REFRESH_ENDPOINT), {
      method: "POST",
      headers: buildHeaders({}, null, true),
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    if (response.ok) {
      return updateAuthSessionTokens(responsePayload)
    }
  }

  return null
}

export async function apiFetch(endpoint, options = {}) {
  const {
    auth = "auto",
    accessToken: explicitAccessToken = null,
    body,
    headers,
    cache = "no-store",
    ...requestInit
  } = options
  const shouldSendJsonBody = shouldSerializeJsonBody(body)
  const requestBody = shouldSendJsonBody ? JSON.stringify(body) : body
  const storedTokens = auth === "auto" ? getAuthTokens() : { accessToken: null, refreshToken: null }
  let accessToken =
    auth === "token" ? explicitAccessToken : auth === "auto" ? storedTokens.accessToken : null

  const executeRequest = async (tokenOverride = accessToken) =>
    performFetch(resolveUrl(endpoint), {
      ...requestInit,
      cache,
      headers: buildHeaders(headers, tokenOverride, shouldSendJsonBody),
      body: requestBody,
    })

  let { response, payload } = await executeRequest(accessToken)

  if (response.status === 401 && auth === "auto" && endpoint !== REFRESH_ENDPOINT) {
    const refreshedSession = await refreshBrowserSession(storedTokens.refreshToken)

    if (refreshedSession?.accessToken) {
      accessToken = refreshedSession.accessToken
      const retryResult = await executeRequest(accessToken)
      response = retryResult.response
      payload = retryResult.payload
    } else {
      clearAuthSession()
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth === "auto") {
      clearAuthSession()
    }

    throw createApiError(response.status, payload)
  }

  return payload
}
