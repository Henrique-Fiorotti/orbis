"use server"

import { headers } from "next/headers"

const DEFAULT_API_URL = "https://server.orbis-3td.com.br"

function normalizeApiUrl(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\/+$/, "")
    : ""
}

const API_URL = normalizeApiUrl(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL)

function getRequestOrigin(headersList) {
  const origin = headersList.get("origin")

  if (origin) {
    return origin
  }

  const host = headersList.get("x-forwarded-host") || headersList.get("host")
  const proto = headersList.get("x-forwarded-proto") || "https"

  return host ? `${proto}://${host}` : "https://www.orbis-3td.com.br"
}

async function getLoginErrorDetails(response) {
  const contentType = response.headers.get("content-type") || ""
  const baseDetails = {
    status: response.status,
    contentType,
    cfRay: response.headers.get("cf-ray") || "",
    server: response.headers.get("server") || "",
    requestId: "",
    bodyPreview: "",
  }

  if (contentType.includes("application/json")) {
    const errorData = await response.json().catch(() => ({}))

    return {
      ...baseDetails,
      requestId: typeof errorData.requestId === "string" ? errorData.requestId : "",
      message: errorData.mensagem || errorData.message || `Erro ${response.status}: falha na autenticação.`,
      bodyPreview: JSON.stringify({
        mensagem: errorData.mensagem,
        message: errorData.message,
        requestId: errorData.requestId,
      }),
    }
  }

  const text = await response.text().catch(() => "")
  const cleanText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

  return {
    ...baseDetails,
    message: cleanText
      ? `Erro ${response.status}: ${cleanText.slice(0, 180)}`
      : `Erro ${response.status}: falha na autenticação.`,
    bodyPreview: cleanText.slice(0, 300),
  }
}

export async function loginAction(formData) {
  const email = formData.get("email")
  const senha = formData.get("password")
  
  if (!email || !senha) {
    return { error: "Preencha todos os campos." }
  }

  try {
    const headersList = await headers()
    const origin = getRequestOrigin(headersList)
    const userAgent = headersList.get("user-agent") || "Orbis Frontend"
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": origin,
        "Referer": `${origin}/login`,
        "User-Agent": userAgent,
        "X-Forwarded-Host": headersList.get("x-forwarded-host") || headersList.get("host") || "",
        "X-Forwarded-Proto": headersList.get("x-forwarded-proto") || "https",
      },
      body: JSON.stringify({ email, senha }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorDetails = await getLoginErrorDetails(response)

      console.warn("auth_login_api_failed", {
        apiHost: new URL(API_URL).host,
        status: errorDetails.status,
        contentType: errorDetails.contentType,
        server: errorDetails.server,
        cfRay: errorDetails.cfRay,
        requestId: errorDetails.requestId,
        bodyPreview: errorDetails.bodyPreview,
      })

      return { error: errorDetails.message }
    }
    const data = await response.json()

    return data
  
  }
  
  catch {
    return { error: "Não foi possível conectar ao servidor. Tente novamente." }
  }
}
