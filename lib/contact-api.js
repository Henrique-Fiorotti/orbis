import { apiFetch } from "@/utils/apiFetch"

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : ""
}

export async function sendContactMessage({ nome, email, assunto, mensagem }) {
  return apiFetch("/email", {
    method: "POST",
    auth: false,
    contextLabel: "sua mensagem",
    body: {
      nome: normalizeString(nome),
      email: normalizeString(email).toLowerCase(),
      assunto: normalizeString(assunto),
      mensagem: normalizeString(mensagem),
    },
  })
}
