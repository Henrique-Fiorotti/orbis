import { apiFetch } from "@/utils/apiFetch"

export function requestPasswordReset({ email, emailDestino }) {
  return apiFetch("/senha/esqueci-senha", {
    method: "POST",
    auth: false,
    contextLabel: "a redefinicao de senha",
    body: { email, emailDestino },
  })
}

export function validatePasswordResetCode({ email, code }) {
  return apiFetch("/senha/validar-codigo", {
    method: "POST",
    auth: false,
    contextLabel: "a validacao do codigo",
    body: { email, code },
  })
}

export function redefinePassword({ email, code, novaSenha }) {
  return apiFetch("/senha/redefinir-senha", {
    method: "POST",
    auth: false,
    contextLabel: "a redefinicao de senha",
    body: { email, code, novaSenha },
  })
}
