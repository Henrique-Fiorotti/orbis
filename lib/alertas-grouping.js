const STATUS_PRIORITY = ["EM_ANDAMENTO", "ATIVO", "RESOLVIDO", "CANCELADO"]

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function getAlertDateValue(alerta) {
  return alerta?.ultimaOcorrenciaEm || alerta?.atualizadoEm || alerta?.criadoEm || ""
}

function getAlertTimestamp(alerta) {
  const timestamp = Date.parse(getAlertDateValue(alerta))
  return Number.isFinite(timestamp) ? timestamp : 0
}

function toPositiveCount(value) {
  const count = Number(value)
  return Number.isFinite(count) && count > 0 ? count : 1
}

function pushUnique(values, value) {
  const normalized = typeof value === "string" ? value.trim() : value

  if (!normalized || values.includes(normalized)) {
    return
  }

  values.push(normalized)
}

function getPrincipalStatus(statusCounts) {
  return STATUS_PRIORITY.find((status) => statusCounts[status] > 0) || Object.keys(statusCounts)[0] || "ATIVO"
}

export function getAlertaMachineGroupKey(alerta) {
  if (alerta?.maquinaId !== null && alerta?.maquinaId !== undefined && alerta?.maquinaId !== "") {
    return `id:${alerta.maquinaId}`
  }

  const maquinaNome = normalizeKey(alerta?.maquinaNome)

  if (maquinaNome) {
    return `nome:${maquinaNome}`
  }

  return "sem-maquina"
}

export function compareMachineGroupRecente(a, b) {
  const timestampDiff = (b.ultimaOcorrenciaTimestamp ?? 0) - (a.ultimaOcorrenciaTimestamp ?? 0)

  if (timestampDiff !== 0) {
    return timestampDiff
  }

  return String(a.maquinaNome ?? "").localeCompare(String(b.maquinaNome ?? ""), "pt-BR")
}

export function groupAlertasByMaquina(alertas) {
  if (!Array.isArray(alertas) || alertas.length === 0) {
    return []
  }

  const sortedAlertas = [...alertas].sort((a, b) => {
    const timestampDiff = getAlertTimestamp(b) - getAlertTimestamp(a)

    if (timestampDiff !== 0) {
      return timestampDiff
    }

    return String(a.maquinaNome ?? "").localeCompare(String(b.maquinaNome ?? ""), "pt-BR")
  })

  const byMachine = new Map()

  for (const alerta of sortedAlertas) {
    const groupId = getAlertaMachineGroupKey(alerta)
    const current =
      byMachine.get(groupId) ??
      {
        id: groupId,
        groupId,
        maquinaId: alerta?.maquinaId ?? null,
        maquinaNome: alerta?.maquinaNome || "Máquina não informada",
        alertas: [],
        tipos: [],
        sensores: [],
        statusCounts: {},
        totalAlertas: 0,
        totalOcorrencias: 0,
        ultimaOcorrenciaEm: getAlertDateValue(alerta),
        ultimaOcorrenciaTimestamp: getAlertTimestamp(alerta),
        recencia: alerta?.recencia ?? null,
        alertaMaisRecente: alerta,
        temRepetidos: false,
        principalStatus: alerta?.status || "ATIVO",
      }

    current.alertas.push(alerta)
    current.totalAlertas += 1
    current.totalOcorrencias += toPositiveCount(alerta?.ocorrencias)
    current.temRepetidos = current.temRepetidos || alerta?.duplicado === true || toPositiveCount(alerta?.ocorrencias) > 1
    current.statusCounts[alerta?.status || "ATIVO"] = (current.statusCounts[alerta?.status || "ATIVO"] ?? 0) + 1

    pushUnique(current.tipos, alerta?.tipo)
    pushUnique(current.sensores, alerta?.sensorNome)

    const timestamp = getAlertTimestamp(alerta)

    if (timestamp > current.ultimaOcorrenciaTimestamp) {
      current.ultimaOcorrenciaTimestamp = timestamp
      current.ultimaOcorrenciaEm = getAlertDateValue(alerta)
      current.recencia = alerta?.recencia ?? current.recencia
      current.alertaMaisRecente = alerta
    }

    current.principalStatus = getPrincipalStatus(current.statusCounts)
    byMachine.set(groupId, current)
  }

  return [...byMachine.values()].sort(compareMachineGroupRecente)
}
