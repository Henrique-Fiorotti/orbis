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
