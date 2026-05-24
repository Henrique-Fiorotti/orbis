function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback
}

export function buildPerfilForm(perfil, savedUser = null) {
  return {
    nome: normalizeString(perfil?.nome),
    email: normalizeString(perfil?.email),
    role: normalizeString(perfil?.role),
    telefone: normalizeString(perfil?.telefone),
    especialidade: normalizeString(perfil?.especialidade) || normalizeString(savedUser?.especialidade),
  }
}

export function buildPerfilUpdateBody(form) {
  const body = {
    telefone: normalizeString(form?.telefone).trim(),
  }
  const especialidade = normalizeString(form?.especialidade).trim()

  if (especialidade) {
    body.especialidade = especialidade
  }

  return body
}
