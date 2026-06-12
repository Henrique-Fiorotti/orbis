const PREDICTION_REASON_LABELS = {
  historico_insuficiente: "Historico insuficiente",
  janela_temporal_insuficiente: "Janela temporal insuficiente",
  modelo_nao_pode_ser_calculado: "Modelo não pode ser calculado",
  tendencia_nao_confiavel: "Tendência não confiável",
  sem_historico_de_alertas_do_tipo: "Sem histórico suficiente desse tipo de alerta",
  evento_ja_ocorrido: "Evento ja ocorrido",
  previsao_fora_da_janela: "Previsão fora da janela monitorada",
  sem_alerta_previsivel: "Sem alerta previsivel",
  leituras_insuficientes: "Leituras insuficientes",
  sem_leitura_recente: "Sem leitura recente",
  historico_de_alertas_insuficiente: "Historico de alertas insuficiente",
  falha_ja_cruzada: "Limiar de falha ja cruzado",
  manutencao_imediata: "Manutenção imediata recomendada",
  modelo_invalido_com_risco: "Modelo invalido com risco operacional",
}

const PREDICTION_STATUS_LABELS = {
  PREVISAO_VALIDA: {
    tone: "stable",
    badge: "Previsão válida",
    title: "Previsão calculada",
    description: "O backend encontrou base suficiente para projetar a proxima janela operacional.",
  },
  SEM_DADOS: {
    tone: "muted",
    badge: "Sem dados confiaveis",
    title: "Predicao sem base confiavel",
    description: "O backend não inventou uma previsão porque os dados ainda não sustentam o cálculo.",
  },
  MANUTENCAO_IMEDIATA: {
    tone: "critical",
    badge: "Prioridade imediata",
    title: "Manutenção imediata",
    description: "A condicao atual exige acao antes de esperar uma nova janela preditiva.",
  },
  FALHA_JA_CRUZADA: {
    tone: "critical",
    badge: "Falha cruzada",
    title: "Limiar de falha atingido",
    description: "A máquina já cruzou o limiar crítico usado pelo modelo.",
  },
  MODELO_INVALIDO_COM_RISCO: {
    tone: "warning",
    badge: "Modelo fraco",
    title: "Modelo invalido, risco presente",
    description: "A regressão não é confiável, mas existem sinais operacionais que pedem acompanhamento.",
  },
}

const PREDICTION_SOURCE_LABELS = {
  REGRESSAO_LINEAR: "Regressão linear",
  HEURISTICA_CRITICA: "Heuristica critica",
  SEM_MODELO: "Sem modelo",
}

const PREDICTION_URGENCY_LABELS = {
  BAIXA: "Baixa",
  MEDIA: "Media",
  ALTA: "Alta",
  IMEDIATA: "Imediata",
}

export const PREDICTIVE_MAINTENANCE_REQUIRED_CONFIRMATIONS = 3

const PREDICTIVE_MAINTENANCE_CRITERIA_LABELS = {
  estadoValido: "Predicao ainda nao esta valida",
  dataAgendadaDisponivel: "Data sugerida ainda nao foi calculada",
  r2Minimo: "Confianca estatistica abaixo do minimo",
  pontosMinimos: "Poucos pontos historicos para confirmar a tendencia",
  preventivaManualProxima: "Existe preventiva manual proxima",
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizePredictionCode(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").toUpperCase()
    : ""
}

function humanizeCode(value) {
  const normalized = String(value || "").trim().replace(/_/g, " ").toLowerCase()

  if (!normalized) {
    return ""
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = normalizePredictionCode(value)

    if (["TRUE", "SIM", "ATIVO", "ACTIVE", "1"].includes(normalized)) {
      return true
    }

    if (["FALSE", "NAO", "INATIVO", "INACTIVE", "0"].includes(normalized)) {
      return false
    }
  }

  return fallback
}

function normalizeTimestamp(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date.toISOString() : null
  }

  return null
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : []
}

export function formatPredictionReason(reason) {
  if (!reason) {
    return ""
  }

  const key = String(reason).trim()
  return PREDICTION_REASON_LABELS[key] ?? humanizeCode(key)
}

export function formatPredictionSource(source) {
  const key = normalizePredictionCode(source)
  return PREDICTION_SOURCE_LABELS[key] ?? humanizeCode(source)
}

export function formatPredictionUrgency(urgency) {
  const key = normalizePredictionCode(urgency)
  return PREDICTION_URGENCY_LABELS[key] ?? humanizeCode(urgency)
}

export function formatPredictiveMaintenanceCriteria(criteria) {
  return PREDICTIVE_MAINTENANCE_CRITERIA_LABELS[criteria] ?? humanizeCode(criteria)
}

export function normalizePredictiveMaintenanceState(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  return {
    validasConsecutivas: Math.max(0, Math.round(toNullableNumber(raw.validasConsecutivas) ?? 0)),
    invalidasConsecutivas: Math.max(0, Math.round(toNullableNumber(raw.invalidasConsecutivas) ?? 0)),
    ultimaPredicaoEm: normalizeTimestamp(raw.ultimaPredicaoEm),
    ultimaDataAgendada: normalizeTimestamp(raw.ultimaDataAgendada),
    ultimaPrevisaoManutencao: normalizeTimestamp(raw.ultimaPrevisaoManutencao),
    ultimoEstadoPredicao: normalizePredictionCode(raw.ultimoEstadoPredicao ?? raw.estadoPredicao),
    ultimoMotivo: typeof raw.ultimoMotivo === "string" ? raw.ultimoMotivo.trim() : "",
    scoreConfianca: toNullableNumber(raw.scoreConfianca),
    criteriosAprovados: normalizeStringArray(raw.criteriosAprovados),
    criteriosReprovados: normalizeStringArray(raw.criteriosReprovados),
    bloqueadaPorPreventivaManual: normalizeBoolean(raw.bloqueadaPorPreventivaManual),
    preventivaManualProximaId: toNullableNumber(raw.preventivaManualProximaId),
    modeloIntegridade: getPredictionModelMetadata(raw.modeloIntegridade),
  }
}

export function getPredictiveMaintenanceStatus({
  estado,
  manutencaoPreditiva,
  requiredConfirmations = PREDICTIVE_MAINTENANCE_REQUIRED_CONFIRMATIONS,
} = {}) {
  const maintenanceStatus = normalizePredictionCode(manutencaoPreditiva?.status)
  const validas = Math.max(0, Math.round(toNullableNumber(estado?.validasConsecutivas) ?? 0))
  const required = Math.max(1, Math.round(toNullableNumber(requiredConfirmations) ?? PREDICTIVE_MAINTENANCE_REQUIRED_CONFIRMATIONS))

  if (maintenanceStatus === "EM_ANDAMENTO") {
    return {
      type: "em_andamento",
      tone: "warning",
      badge: "Em andamento",
      title: "Preventiva preditiva em andamento",
      description: "Preventiva preditiva em andamento.",
    }
  }

  if (maintenanceStatus === "AGENDADA") {
    return {
      type: "agendada",
      tone: "stable",
      badge: "Agendada",
      title: "Preventiva preditiva agendada",
      description: "Preventiva preditiva agendada.",
    }
  }

  if (estado?.bloqueadaPorPreventivaManual) {
    return {
      type: "bloqueada",
      tone: "warning",
      badge: "Bloqueado",
      title: "Agendamento automatico bloqueado",
      description: "Agendamento automatico bloqueado: ja existe preventiva manual proxima.",
    }
  }

  if (!estado || estado.ultimoEstadoPredicao === "SEM_DADOS") {
    return {
      type: "sem_dados",
      tone: "muted",
      badge: "Sem dados",
      title: "Sem predicao suficiente",
      description: "Ainda nao ha dados suficientes para agendamento preditivo.",
    }
  }

  if (estado.ultimoEstadoPredicao === "PREVISAO_VALIDA" && validas < required) {
    return {
      type: "confirmacao",
      tone: "attention",
      badge: `${validas}/${required}`,
      title: "Predicao em confirmacao",
      description: `Predicao em confirmacao: ${validas}/${required} leituras validas.`,
    }
  }

  if (estado.ultimoEstadoPredicao === "PREVISAO_VALIDA") {
    return {
      type: "confirmada",
      tone: "attention",
      badge: `${Math.min(validas, required)}/${required}`,
      title: "Predicao confirmada",
      description: "Predicao valida aguardando criacao ou sincronizacao da preventiva preditiva.",
    }
  }

  return {
    type: "analise",
    tone: "muted",
    badge: humanizeCode(estado.ultimoEstadoPredicao) || "Em analise",
    title: "Predicao em analise",
    description: formatPredictionReason(estado.ultimoMotivo) || "A predicao ainda esta em analise pelo backend.",
  }
}

export function getPredictionOperationalStatus(predicao) {
  if (!predicao || typeof predicao !== "object") {
    return null
  }

  const hasOperationalFields = [
    predicao.estadoPredicao,
    predicao.fonteDecisao,
    predicao.urgencia,
    predicao.motivo,
  ].some((value) => value !== null && value !== undefined && String(value).trim() !== "")

  if (!hasOperationalFields) {
    return null
  }

  const state = normalizePredictionCode(predicao.estadoPredicao)
  const base = PREDICTION_STATUS_LABELS[state] ?? {
    tone: "muted",
    badge: humanizeCode(predicao.estadoPredicao) || "Status indisponivel",
    title: "Status operacional da predicao",
    description: "O backend retornou um estado de predicao ainda sem tratamento especifico no frontend.",
  }

  return {
    state,
    ...base,
    source: normalizePredictionCode(predicao.fonteDecisao),
    sourceLabel: formatPredictionSource(predicao.fonteDecisao),
    urgency: normalizePredictionCode(predicao.urgencia),
    urgencyLabel: formatPredictionUrgency(predicao.urgencia),
    reason: typeof predicao.motivo === "string" ? predicao.motivo : "",
    reasonLabel: formatPredictionReason(predicao.motivo),
  }
}

export function getPredictionModelMetadata(modelo) {
  if (!modelo || typeof modelo !== "object") {
    return null
  }

  return {
    ...modelo,
    r2: toNullableNumber(modelo.r2),
    slope: toNullableNumber(modelo.slope),
    intercept: toNullableNumber(modelo.intercept),
    pontosUsados: toNullableNumber(modelo.pontosUsados),
    janelaHorasCoberta: toNullableNumber(modelo.janelaHorasCoberta),
    ultimoPontoEm: typeof modelo.ultimoPontoEm === "string" && modelo.ultimoPontoEm.trim()
      ? modelo.ultimoPontoEm.trim()
      : null,
  }
}

export function formatCoveredHours(value) {
  const hours = toNullableNumber(value)

  if (hours === null) {
    return "N/A"
  }

  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60))
    return `${minutes} min`
  }

  if (hours < 24) {
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(hours)} h`
  }

  const days = hours / 24
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(days)} d`
}
