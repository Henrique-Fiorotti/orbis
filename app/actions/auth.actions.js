"use server"

const API_URL = process.env.API_URL || "https://orbis-5hnm.onrender.com"

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
      return { error: errorData.mensagem || errorData.message || `Erro ${response.status}: falha na autenticacao.` }
    }

    return await response.json()
  } catch (error) {
    console.error("[loginAction]", error)
    return { error: "Nao foi possivel conectar ao servidor. Tente novamente." }
  }
}
