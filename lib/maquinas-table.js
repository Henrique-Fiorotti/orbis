export const MAQUINA_IMPORTANCIA_FILTER_OPTIONS = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Média" },
  { value: "BAIXA", label: "Baixa" },
]

export const MAQUINA_STATUS_FILTER_OPTIONS = [
  { value: "OK", label: "OK" },
  { value: "COM_ALERTA", label: "Com alerta" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "SEM_SENSOR", label: "Sem sensor" },
]

export const MAQUINA_INTEGRIDADE_FILTER_OPTIONS = [
  { value: "estavel", label: "Estável (75%+)" },
  { value: "atencao", label: "Atenção (50% a 74%)" },
  { value: "critico", label: "Crítico (< 50%)" },
]

export const MAQUINA_IMPORTANCIA_SORT_OPTIONS = [
  { value: "desc", label: "Alta primeiro", desc: true },
  { value: "asc", label: "Baixa primeiro", desc: false },
]

export const MAQUINA_STATUS_SORT_OPTIONS = [
  { value: "desc", label: "Alertas primeiro", desc: true },
  { value: "asc", label: "OK primeiro", desc: false },
]

export const MAQUINA_INTEGRIDADE_SORT_OPTIONS = [
  { value: "desc", label: "Maior primeiro", desc: true },
  { value: "asc", label: "Menor primeiro", desc: false },
]

const IMPORTANCIA_ORDER = { BAIXA: 1, MEDIA: 2, ALTA: 3 }
const STATUS_ORDER = { SEM_SENSOR: 0, OK: 1, EM_ANDAMENTO: 2, COM_ALERTA: 3 }

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export function maquinaTemSensores(maquina) {
  const sensores = Number(maquina?.sensores ?? 0)
  return Number.isFinite(sensores) && sensores > 0
}

export function getMaquinaStatusExibicao(maquina) {
  if (maquina?.statusAlertas === "COM_ALERTA" || maquina?.statusAlertas === "EM_ANDAMENTO") {
    return maquina.statusAlertas
  }

  if (!maquinaTemSensores(maquina)) {
    return "SEM_SENSOR"
  }

  return "OK"
}

export function getMaquinaAlertasStatus(maquina, alertas = []) {
  const maquinaId = maquina?.id === null || maquina?.id === undefined ? "" : String(maquina.id)
  const maquinaNome = normalizeKey(maquina?.nome)
  let hasEmAndamento = false

  for (const alerta of alertas) {
    const matchesId = maquinaId && alerta?.maquinaId !== null && alerta?.maquinaId !== undefined && String(alerta.maquinaId) === maquinaId
    const matchesName = maquinaNome && normalizeKey(alerta?.maquinaNome) === maquinaNome

    if (!matchesId && !matchesName) {
      continue
    }

    if (alerta?.status === "ATIVO" || alerta?.status === "ABERTO") {
      return "COM_ALERTA"
    }

    if (alerta?.status === "EM_ANDAMENTO") {
      hasEmAndamento = true
    }
  }

  return hasEmAndamento ? "EM_ANDAMENTO" : null
}

export function withMaquinaAlertasStatus(maquinas = [], alertas = []) {
  return maquinas.map((maquina) => ({
    ...maquina,
    statusAlertas: getMaquinaAlertasStatus(maquina, alertas),
  }))
}

export function getMaquinaIntegridadeExibicao(maquina) {
  return maquinaTemSensores(maquina) ? maquina?.integridade : null
}

export function getMaquinaUltimaLeituraExibicao(maquina) {
  return maquinaTemSensores(maquina) ? maquina?.ultimaLeituraEm : null
}

export function selectMaquinaFilterFn(row, columnId, value) {
  if (!value) {
    return true
  }

  return row.getValue(columnId) === value
}

export function integridadeMaquinaFilterFn(row, columnId, value) {
  const rowValue = row.getValue(columnId)
  const integridade = Number(rowValue)

  if (!value) {
    return true
  }

  if (rowValue === null || rowValue === undefined || rowValue === "" || !Number.isFinite(integridade)) {
    return false
  }

  if (value === "Estável") {
    return integridade >= 75
  }

  if (value === "Atenção") {
    return integridade >= 50 && integridade < 75
  }

  if (value === "Crítico") {
    return integridade < 50
  }

  return true
}

function orderedValueSortFn(order) {
  return (rowA, rowB, columnId) => {
    const valueA = order[rowA.getValue(columnId)] ?? 0
    const valueB = order[rowB.getValue(columnId)] ?? 0

    return valueA - valueB
  }
}

export const importanciaMaquinaSortFn = orderedValueSortFn(IMPORTANCIA_ORDER)
export const statusMaquinaSortFn = orderedValueSortFn(STATUS_ORDER)
