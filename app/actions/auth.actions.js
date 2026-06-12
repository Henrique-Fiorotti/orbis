"use server"

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "")

export async function loginAction(formData) {
  const email = formData.get("email")
  const senha = formData.get("password")
  
  if (!email || !senha) {
    return { error: "Preencha todos os campos." }
  }

  try {
    if (!API_URL) {
      return { error: "API_URL nao configurada. Defina API_URL no .env." }
    }

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
