export const MAQUINA_IMPORTANCIA_FILTER_OPTIONS = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAIXA", label: "Baixa" },
]

export const MAQUINA_STATUS_FILTER_OPTIONS = [
  { value: "OK", label: "OK" },
  { value: "ALERTA", label: "Alerta" },
  { value: "SEM_SENSOR", label: "Sem sensor" },
]

export const MAQUINA_INTEGRIDADE_FILTER_OPTIONS = [
  { value: "estavel", label: "Estavel (75%+)" },
  { value: "atencao", label: "Atencao (50% a 74%)" },
  { value: "critico", label: "Critico (< 50%)" },
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
const STATUS_ORDER = { SEM_SENSOR: 0, OK: 1, ALERTA: 2 }

export function maquinaTemSensores(maquina) {
  const sensores = Number(maquina?.sensores ?? 0)
  return Number.isFinite(sensores) && sensores > 0
}

export function getMaquinaStatusExibicao(maquina) {
  if (!maquinaTemSensores(maquina)) {
    return "SEM_SENSOR"
  }

  return maquina?.status ?? "OK"
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

  if (value === "estavel") {
    return integridade >= 75
  }

  if (value === "atencao") {
    return integridade >= 50 && integridade < 75
  }

  if (value === "critico") {
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
