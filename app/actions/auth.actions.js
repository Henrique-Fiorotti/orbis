"use server"

const API_URL = "http://localhost:3001"

export async function loginAction(formData) {
    const email = formData.get("email")
    const senha = formData.get("password")

    if (!email || !senha) {
        return { error: "Preencha todo o Campo" }
    }


    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });

        if (response.error){
            return { error: response.error }
        }

        const data = await response.json();

        return data

    } catch (error) {
        return { error: "Ocorreu um erro ao fazer login" }
    }
}