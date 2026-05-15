import { apiFetch } from "@/utils/apiFetch"

export function requestPasswordReset({ email, emailDestino }) {
  return apiFetch("/senha/esqueci-senha", {
    method: "POST",
    auth: false,
    contextLabel: "a redefinição de senha",
    body: { email, emailDestino },
  })
}

export function validatePasswordResetCode({ email, code }) {
  return apiFetch("/senha/validar-codigo", {
    method: "POST",
    auth: false,
    contextLabel: "a validação do código",
    body: { email, code },
  })
}

export function redefinePassword({ email, code, novaSenha }) {
  return apiFetch("/senha/redefinir-senha", {
    method: "POST",
    auth: false,
    contextLabel: "a redefinição de senha",
    body: { email, code, novaSenha },
  })
}
