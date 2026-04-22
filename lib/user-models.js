function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim()
}

export function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

export function pickFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value
    }
  }

  return undefined
}

export function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeRole(value, fallback = null) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalizedItem = normalizeRole(item)

      if (normalizedItem) {
        return normalizedItem
      }
    }

    return fallback
  }

  if (value && typeof value === "object") {
    return normalizeRole(
      pickFirstDefined(value.role, value.nome, value.name, value.authority, value.value),
      fallback
    )
  }

  if (typeof value !== "string" || !value.trim()) {
    return fallback
  }

  const normalizedValue = normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^ROLE_/i, "")
    .toUpperCase()

  if (
    normalizedValue.includes("ADMIN") ||
    normalizedValue.includes("GESTOR") ||
    normalizedValue.includes("MANAGER")
  ) {
    return "ADMIN"
  }

  if (
    normalizedValue.includes("TECNICO") ||
    normalizedValue.includes("TECHNICIAN") ||
    normalizedValue.includes("OPERADOR")
  ) {
    return "TECNICO"
  }

  return fallback
}

export function normalizeStatus(value, fallback = "ATIVO") {
  if (typeof value === "boolean") {
    return value ? "ATIVO" : "INATIVO"
  }

  const normalizedValue = normalizeString(String(value ?? ""), "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()

  if (["ATIVO", "ONLINE", "ENABLE", "ENABLED", "TRUE", "1"].includes(normalizedValue)) {
    return "ATIVO"
  }

  if (
    ["INATIVO", "OFFLINE", "DISABLE", "DISABLED", "FALSE", "0", "BLOQUEADO"].includes(
      normalizedValue
    )
  ) {
    return "INATIVO"
  }

  return fallback
}

export function normalizeUserRecord(raw, fallback = {}) {
  const source = raw && typeof raw === "object" ? raw : {}

  const role = normalizeRole(
    pickFirstDefined(
      source.role,
      source.cargo,
      source.tipoConta,
      source.tipoUsuario,
      source.perfil,
      fallback.role
    ),
    normalizeRole(fallback.role)
  )

  return {
    id: toNumber(pickFirstDefined(source.id, source.usuarioId, source.tecnicoId, fallback.id), 0),
    nome:
      pickFirstString(
        source.nome,
        source.name,
        source.nomeCompleto,
        source.usuarioNome,
        source.fullName,
        fallback.nome
      ) || "Usuario Orbis",
    email: pickFirstString(source.email, source.mail, source.usuarioEmail, fallback.email),
    telefone: pickFirstString(
      source.telefone,
      source.phone,
      source.celular,
      source.numeroContato,
      fallback.telefone
    ),
    especialidade: pickFirstString(
      source.especialidade,
      source.skill,
      source.areaTecnica,
      source.funcao,
      fallback.especialidade
    ),
    setor: pickFirstString(source.setor, source.departamento, source.area, fallback.setor),
    status: normalizeStatus(
      pickFirstDefined(source.status, source.situacao, source.ativo, fallback.status),
      normalizeStatus(fallback.status, "ATIVO")
    ),
    alertasAtendidos: toNumber(
      pickFirstDefined(
        source.alertasAtendidos,
        source.totalAlertasAtendidos,
        source.alertasResolvidos,
        fallback.alertasAtendidos
      ),
      0
    ),
    criadoEm: pickFirstString(
      source.criadoEm,
      source.createdAt,
      source.dataCadastro,
      source.dataCriacao,
      fallback.criadoEm
    ),
    ultimoLoginEm: pickFirstString(
      source.ultimoLoginEm,
      source.ultimoLogin,
      source.lastLoginAt,
      source.dataUltimoLogin,
      fallback.ultimoLoginEm
    ),
    foto:
      pickFirstString(
        source.foto,
        source.avatar,
        source.imagem,
        source.photoUrl,
        source.avatarUrl,
        fallback.foto
      ) || null,
    role,
  }
}

export function formatRoleLabel(role) {
  if (normalizeRole(role) === "ADMIN") {
    return "Administrador"
  }

  return "Tecnico"
}

export function getUserInitials(nome) {
  return normalizeString(nome, "Usuario")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("")
}
