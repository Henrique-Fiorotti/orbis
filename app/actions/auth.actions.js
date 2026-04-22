"use server"

import { apiFetch } from "@/utils/apiFetch"

export async function loginAction(formData) {
  const email = formData.get("email")
  const senha = formData.get("password")
  
  if (!email || !senha) {
    return { error: "Preencha todos os campos." }
  }

  try {
    return await apiFetch("/auth/login", {
      auth: "none",
      method: "POST",
      body: { email, senha },
    })
  } catch (error) {
    console.error("[loginAction]", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel conectar ao servidor. Tente novamente.",
    }
  }
}
