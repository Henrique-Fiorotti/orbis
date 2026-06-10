function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function normalizeUppercase(value) {
  return normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase()
}

function normalizeTimestamp(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date.toISOString() : ""
  }

  return ""
}

function normalizePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value
}

function normalizeManutencaoTipo(value, alertaId) {
  const normalized = normalizeUppercase(value)

  if (normalized === "PREVENTIVA") {
    return "PREVENTIVA"
  }

  if (normalized === "CORRETIVA" || alertaId !== null) {
    return "CORRETIVA"
  }

  return "PREVENTIVA"
}

function normalizeManutencaoStatus(value) {
  const normalized = normalizeUppercase(value)
  const mapped = {
    ABERTO: "EM_ANDAMENTO",
    ATIVO: "EM_ANDAMENTO",
    ANDAMENTO: "EM_ANDAMENTO",
    EM_ATENDIMENTO: "EM_ANDAMENTO",
    INICIADO: "EM_ANDAMENTO",
    INICIADA: "EM_ANDAMENTO",
    PENDENTE: "AGENDADA",
    PROGRAMADA: "AGENDADA",
    PROGRAMADO: "AGENDADA",
    CONCLUIDO: "RESOLVIDO",
    CONCLUIDA: "RESOLVIDO",
    FINALIZADO: "RESOLVIDO",
    FINALIZADA: "RESOLVIDO",
    ENCERRADO: "RESOLVIDO",
    ENCERRADA: "RESOLVIDO",
    CANCELADO: "CANCELADA",
  }[normalized] ?? normalized

  if (["AGENDADA", "EM_ANDAMENTO", "RESOLVIDO", "CANCELADA", "ENCERRADO_SEM_SOLUCAO"].includes(mapped)) {
    return mapped
  }

  return "EM_ANDAMENTO"
}

function normalizeManutencaoPrioridade(value) {
  const normalized = normalizeUppercase(value)
  return ["BAIXA", "MEDIA", "ALTA", "URGENTE"].includes(normalized) ? normalized : null
}

function normalizeManutencaoOrigem(value, alertaId) {
  const normalized = normalizeUppercase(value)

  if (["MANUAL", "ALERTA", "PREDICAO"].includes(normalized)) {
    return normalized
  }

  return alertaId === null ? "MANUAL" : "ALERTA"
}

function normalizeCumprimentoAgendamento(value) {
  const normalized = normalizeUppercase(value)
  return ["ANTECIPADA", "NO_PRAZO", "ATRASADA", "NAO_APLICAVEL"].includes(normalized)
    ? normalized
    : "NAO_APLICAVEL"
}

function normalizeManutencaoUsuario(source) {
  const usuario = source?.usuario && typeof source.usuario === "object" ? source.usuario : null
  const tecnico = source?.tecnico && typeof source.tecnico === "object" ? source.tecnico : null
  const user = usuario ?? tecnico
  const id = toNullableNumber(source?.usuarioId ?? source?.tecnicoId ?? user?.id)

  if (!id && !user && !source?.usuarioNome && !source?.tecnicoNome) {
    return null
  }

  return {
    id,
    nome: normalizeString(source?.usuarioNome ?? source?.tecnicoNome ?? user?.nome ?? user?.name, id ? `Usuario ${id}` : "Usuario nao informado"),
    email: normalizeString(source?.usuarioEmail ?? source?.tecnicoEmail ?? user?.email, ""),
    role: normalizeUppercase(source?.usuarioRole ?? source?.tecnicoRole ?? user?.role) || "TECNICO",
    telefone: normalizeString(source?.usuarioTelefone ?? source?.tecnicoTelefone ?? user?.telefone, ""),
    especialidade: normalizeString(source?.usuarioEspecialidade ?? source?.tecnicoEspecialidade ?? user?.especialidade, ""),
  }
}

export function normalizeManutencaoRecord(raw, index = 0, normalizers = {}) {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const alertaId = toNullableNumber(raw.alertaId ?? raw.alerta?.id)
  const maquinaId = toNullableNumber(raw.maquinaId ?? raw.maquina?.id ?? raw.alerta?.maquinaId ?? raw.alerta?.maquina?.id)
  const tipo = normalizeManutencaoTipo(raw.tipo ?? raw.tipoManutencao, alertaId)
  const maquina = raw.maquina && typeof raw.maquina === "object" && typeof normalizers.normalizeMaquina === "function"
    ? normalizers.normalizeMaquina(raw.maquina, index)
    : null
  const alerta = raw.alerta && typeof raw.alerta === "object" && typeof normalizers.normalizeAlerta === "function"
    ? normalizers.normalizeAlerta(raw.alerta, index)
    : null
  const titulo = normalizeString(
    raw.titulo ?? raw.title ?? raw.nome ?? raw.assunto,
    tipo === "PREVENTIVA" ? "Manutencao preventiva" : "Manutencao corretiva"
  )

  return {
    id: toNumber(raw.id ?? raw.manutencaoId, index + 1),
    tipo,
    titulo,
    prioridade: normalizeManutencaoPrioridade(raw.prioridade ?? raw.priority),
    origem: normalizeManutencaoOrigem(raw.origem ?? raw.source, alertaId),
    alertaId,
    maquinaId,
    usuarioId: toNullableNumber(raw.usuarioId ?? raw.tecnicoId ?? raw.usuario?.id ?? raw.tecnico?.id),
    observacao: normalizeString(raw.observacao ?? raw.descricao ?? raw.mensagem, ""),
    status: normalizeManutencaoStatus(raw.status ?? raw.estado ?? raw.situacao),
    dataAgendada: normalizeTimestamp(raw.dataAgendada ?? raw.agendadaEm ?? raw.scheduledAt) || null,
    janelaAgendadaInicio: normalizeTimestamp(raw.janelaAgendadaInicio ?? raw.janelaInicio ?? raw.scheduledWindowStart) || null,
    janelaAgendadaFim: normalizeTimestamp(raw.janelaAgendadaFim ?? raw.janelaFim ?? raw.scheduledWindowEnd) || null,
    concluidaEm: normalizeTimestamp(raw.concluidaEm ?? raw.finalizadaEm ?? raw.completedAt) || null,
    cumprimentoAgendamento: normalizeCumprimentoAgendamento(raw.cumprimentoAgendamento ?? raw.scheduleCompliance),
    diasDesvioAgendamento: toNullableNumber(raw.diasDesvioAgendamento ?? raw.scheduleDeviationDays),
    metadataPredicao: normalizePlainObject(raw.metadataPredicao ?? raw.predictionMetadata),
    criadoEm: normalizeTimestamp(raw.criadoEm ?? raw.createdAt ?? raw.dataCriacao) || new Date().toISOString(),
    atualizadoEm: normalizeTimestamp(raw.atualizadoEm ?? raw.updatedAt) || null,
    alerta,
    maquina,
    maquinaNome: normalizeString(raw.maquinaNome ?? raw.nomeMaquina ?? maquina?.nome ?? alerta?.maquinaNome, maquinaId ? `Maquina ${maquinaId}` : "Maquina nao informada"),
    usuario: normalizeManutencaoUsuario(raw),
  }
}

export function normalizeManutencaoCollection(payload, normalizers = {}) {
  const candidates = [
    payload,
    payload?.content,
    payload?.dados,
    payload?.data,
    payload?.items,
    payload?.resultado,
    payload?.results,
    payload?.manutencoes,
  ]
  const collection = candidates.find(Array.isArray) ?? []

  return collection
    .map((item, index) => normalizeManutencaoRecord(item, index, normalizers))
    .filter(Boolean)
}

export function buildPreventiveMaintenancePayload({ maquinaId, titulo, prioridade, dataAgendada, observacao }) {
  const maquinaIdNumber = Number(maquinaId)
  const texto = normalizeString(observacao)
  const payload = {
    tipo: "PREVENTIVA",
    maquinaId: maquinaIdNumber,
  }
  const normalizedTitle = normalizeString(titulo)
  const normalizedPriority = normalizeManutencaoPrioridade(prioridade)
  const normalizedSchedule = normalizeTimestamp(dataAgendada)

  if (!Number.isFinite(maquinaIdNumber)) {
    throw new Error("Selecione uma maquina valida para a preventiva.")
  }

  if (!texto) {
    throw new Error("Informe uma observacao para a manutencao preventiva.")
  }

  if (normalizedTitle) {
    payload.titulo = normalizedTitle
  }

  if (normalizedPriority) {
    payload.prioridade = normalizedPriority
  }

  if (normalizedSchedule) {
    payload.dataAgendada = normalizedSchedule
  }

  payload.observacao = texto
  return payload
}
