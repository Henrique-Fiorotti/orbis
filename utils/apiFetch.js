import { clearAuthSession, getAuthSession, saveAuthSession } from "@/lib/auth-session"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://orbis-5hnm.onrender.com"

function isFormDataBody(value) {
  return typeof FormData !== "undefined" && value instanceof FormData
}

function buildUrl(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint
  }

  return `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
}

function isRefreshEndpoint(endpoint) {
  return endpoint === "/auth/refresh" || endpoint === "auth/refresh"
}

function createHttpError(status, message, payload = null) {
  const error = new Error(message)
  error.status = status
  error.payload = payload
  return error
}

function getApiErrorMessage(statusCode, payload, contextLabel) {
  if (statusCode === 401) {
    return "Sua sessão expirou. Faça login novamente."
  }

  if (statusCode === 403) {
    return payload?.mensagem || payload?.message || `Seu usuário não tem permissão para acessar ${contextLabel}.`
  }

  return payload?.mensagem || payload?.message || `Erro ${statusCode} ao carregar ${contextLabel}.`
}

async function parseJsonResponse(response) {
  if (response.status === 204) {
    return null
  }

  return response.json().catch(() => null)
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: refreshToken }),
    cache: "no-store",
  })
  const payload = await parseJsonResponse(response)

  if (!response.ok || !payload?.accessToken) {
    throw createHttpError(
      response.status,
      getApiErrorMessage(response.status, payload, "sua sessão"),
      payload
    )
  }

  return payload.accessToken
}

function createRequestInit(options, accessToken) {
  const {
    body,
    headers = {},
    auth = true,
    accessToken: _accessToken,
    contextLabel: _contextLabel,
    retryOnUnauthorized: _retryOnUnauthorized,
    ...fetchOptions
  } = options
  const shouldSendBody = body !== undefined
  const shouldSendFormData = isFormDataBody(body)

  return {
    ...fetchOptions,
    headers: {
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(shouldSendBody && !shouldSendFormData ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(shouldSendBody
      ? { body: shouldSendFormData || typeof body === "string" ? body : JSON.stringify(body) }
      : {}),
  }
}

export async function apiFetch(endpoint, options = {}) {
  const {
    accessToken: explicitAccessToken,
    auth = true,
    cache = "no-store",
    contextLabel = "o dashboard",
    method = "GET",
    retryOnUnauthorized = true,
  } = options
  const session = getAuthSession()
  const accessToken = explicitAccessToken || session?.accessToken || null
  const requestOptions = { ...options, auth, cache, method }
  let response = await fetch(buildUrl(endpoint), createRequestInit(requestOptions, accessToken))
  let payload = await parseJsonResponse(response)

  if (
    response.status === 401 &&
    auth &&
    retryOnUnauthorized &&
    !isRefreshEndpoint(endpoint) &&
    session?.refreshToken
  ) {
    try {
      const refreshedAccessToken = await refreshAccessToken(session.refreshToken)

      saveAuthSession({
        ...session,
        accessToken: refreshedAccessToken,
      })

      response = await fetch(buildUrl(endpoint), createRequestInit(requestOptions, refreshedAccessToken))
      payload = await parseJsonResponse(response)
    } catch (error) {
      clearAuthSession()
      throw error
    }
  }

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearAuthSession()
    }

    throw createHttpError(
      response.status,
      getApiErrorMessage(response.status, payload, contextLabel),
      payload
    )
  }

  return payload
}
