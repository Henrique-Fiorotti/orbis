import { z } from "zod"

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

const OptionalNormalizedCodeSchema = z.preprocess(
  (value) => {
    const normalized = normalizeUppercase(value)
    return normalized || undefined
  },
  z.string().optional()
)

const OptionalTrimmedStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined),
  z.string().optional()
)

const OptionalTimestampSchema = z.preprocess(
  (value) => normalizeTimestamp(value) || undefined,
  z.string().optional()
)

const PredictionMetadataSchema = z.object({
  estadoPredicao: OptionalNormalizedCodeSchema.catch(undefined),
  fonteDecisao: OptionalNormalizedCodeSchema.catch(undefined),
  urgencia: OptionalNormalizedCodeSchema.catch(undefined),
  motivo: OptionalTrimmedStringSchema.catch(undefined),
  previsaoManutencao: OptionalTimestampSchema.catch(undefined),
  dataAgendada: OptionalTimestampSchema.catch(undefined),
  janelaAgendadaInicio: OptionalTimestampSchema.catch(undefined),
  janelaAgendadaFim: OptionalTimestampSchema.catch(undefined),
}).passthrough()

const MaintenanceApiRecordSchema = z.object({
  id: z.any().optional(),
  manutencaoId: z.any().optional(),
  alertaId: z.any().optional(),
  maquinaId: z.any().optional(),
  usuarioId: z.any().optional(),
  tecnicoId: z.any().optional(),
  tipo: z.any().optional(),
  tipoManutencao: z.any().optional(),
  titulo: z.any().optional(),
  title: z.any().optional(),
  nome: z.any().optional(),
  assunto: z.any().optional(),
  prioridade: z.any().optional(),
  priority: z.any().optional(),
  origem: z.any().optional(),
  source: z.any().optional(),
  observacao: z.any().optional(),
  descricao: z.any().optional(),
  mensagem: z.any().optional(),
  status: z.any().optional(),
  estado: z.any().optional(),
  situacao: z.any().optional(),
  dataAgendada: z.any().optional(),
  agendadaEm: z.any().optional(),
  scheduledAt: z.any().optional(),
  janelaAgendadaInicio: z.any().optional(),
  janelaInicio: z.any().optional(),
  scheduledWindowStart: z.any().optional(),
  janelaAgendadaFim: z.any().optional(),
  janelaFim: z.any().optional(),
  scheduledWindowEnd: z.any().optional(),
  concluidaEm: z.any().optional(),
  finalizadaEm: z.any().optional(),
  completedAt: z.any().optional(),
  cumprimentoAgendamento: z.any().optional(),
  scheduleCompliance: z.any().optional(),
  diasDesvioAgendamento: z.any().optional(),
  scheduleDeviationDays: z.any().optional(),
  metadataPredicao: PredictionMetadataSchema.nullish().catch(null),
  predictionMetadata: PredictionMetadataSchema.nullish().catch(null),
  criadoEm: z.any().optional(),
  createdAt: z.any().optional(),
  dataCriacao: z.any().optional(),
  atualizadoEm: z.any().optional(),
  updatedAt: z.any().optional(),
  alerta: z.any().optional(),
  maquina: z.any().optional(),
  usuario: z.any().optional(),
  tecnico: z.any().optional(),
}).passthrough()

function parseMaintenanceApiRecord(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const parsed = MaintenanceApiRecordSchema.safeParse(raw)

  if (parsed.success) {
    return parsed.data
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Payload de manutencao fora do contrato", parsed.error.flatten())
  }

  return null
}

function normalizePredictionMetadata(value) {
  const source = normalizePlainObject(value)

  if (!source) {
    return null
  }

  const parsed = PredictionMetadataSchema.safeParse(source)

  if (parsed.success) {
    return parsed.data
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Payload de metadataPredicao fora do contrato", parsed.error.flatten())
  }

  return null
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
  const source = parseMaintenanceApiRecord(raw)

  if (!source) {
    return null
  }

  raw = source

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
    metadataPredicao: normalizePredictionMetadata(raw.metadataPredicao ?? raw.predictionMetadata),
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
