"use server"

const DEFAULT_API_URL = "https://server.orbis-3td.com.br"

function normalizeApiUrl(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\/+$/, "")
    : ""
}

const API_URL = normalizeApiUrl(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL)

export async function loginAction(formData) {
  const email = formData.get("email")
  const senha = formData.get("password")
  
  if (!email || !senha) {
    return { error: "Preencha todos os campos." }
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.mensagem || errorData.message || `Erro ${response.status}: falha na autenticação.` }
    }
    const data = await response.json()

    return data
  
  }
  
  catch {
    return { error: "Não foi possível conectar ao servidor. Tente novamente." }
  }
}
