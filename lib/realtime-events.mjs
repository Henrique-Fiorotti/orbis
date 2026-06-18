export const REALTIME_SENSOR_READING_EVENT = "orbis-sensor-reading"
export const REALTIME_MACHINE_DASHBOARD_UPDATE_EVENT = "orbis-machine-dashboard-update"
export const REALTIME_MACHINE_INTEGRITY_HISTORY_UPDATE_EVENT = "orbis-machine-integrity-history-update"

export const SENSOR_READING_SOCKET_EVENTS = ["novaLeitura", "nova-leitura"]
export const SENSOR_READING_DEDUP_WINDOW_MS = 1500
export const MACHINE_DASHBOARD_SOCKET_EVENTS = ["dashboard-maquina-atualizado", "dashboardMaquinaAtualizado"]
export const MACHINE_INTEGRITY_HISTORY_SOCKET_EVENTS = ["historico-integridade-atualizado", "historicoIntegridadeAtualizado"]
export const MACHINE_UPDATE_DEDUP_WINDOW_MS = 1500

export function getSensorReadingEventKey(payload) {
  if (!payload || typeof payload !== "object") {
    return ""
  }

  const id = payload.id ?? payload.leituraId

  if (id !== undefined && id !== null && id !== "") {
    return `id:${id}`
  }

  const sensorId = payload.sensorId ?? payload.sensor_id ?? payload.sensor?.id
  const criadoEm = payload.criadoEm ?? payload.timestamp ?? payload.createdAt
  const temperatura = payload.temperatura ?? payload.temperature ?? payload.temp
  const vibracao = payload.vibracao ?? payload.vibracao_rms ?? payload.vibration

  if (sensorId === undefined && criadoEm === undefined) {
    return ""
  }

  return [sensorId, criadoEm, temperatura, vibracao]
    .map((value) => value ?? "")
    .join("|")
}

export function getSensorReadingTargetKey(payload) {
  if (!payload || typeof payload !== "object") {
    return ""
  }

  const sensorId = payload.sensorId ?? payload.sensor_id ?? payload.sensor?.id

  if (sensorId === undefined || sensorId === null || sensorId === "") {
    return getSensorReadingEventKey(payload)
  }

  return `sensor:${sensorId}`
}

function getMachineId(payload) {
  if (!payload || typeof payload !== "object") {
    return undefined
  }

  return payload.maquinaId ??
    payload.maquina_id ??
    payload.idMaquina ??
    payload.maquina?.id ??
    payload.historicoIntegridade?.maquinaId ??
    payload.historico_integridade?.maquinaId ??
    payload.historico?.maquinaId
}

function getIntegrityHistoryKey(payload) {
  const historico = payload?.historicoIntegridade ?? payload?.historico_integridade ?? payload?.historico
  const point = Array.isArray(historico) ? historico.at(-1) : historico

  if (!point || typeof point !== "object") {
    return ""
  }

  const id = point.id ?? point.historicoId ?? point.historico_integridade_id
  const timestamp =
    point.criadoEm ??
    point.criado_em ??
    point.createdAt ??
    point.created_at ??
    point.registradoEm ??
    point.registrado_em ??
    point.timestamp
  const integridade =
    point.integridade ??
    point.integridadeAtual ??
    point.integridade_atual ??
    point.integridadeMedia ??
    point.integridade_media ??
    point.saude ??
    point.healthScore

  return [id, timestamp, integridade]
    .map((value) => value ?? "")
    .join("|")
}

export function getMachineUpdateEventKey(payload, eventType = "") {
  if (!payload || typeof payload !== "object") {
    return ""
  }

  const maquinaId = getMachineId(payload)
  const leituraId = payload.leituraId ?? payload.leitura?.id ?? payload.leitura?.leituraId
  const maquinaUpdatedAt =
    payload.maquina?.ultimaLeituraEm ??
    payload.maquina?.ultimaAtualizacao ??
    payload.maquina?.updatedAt ??
    payload.maquina?.dataUltimaLeitura
  const historicoKey = getIntegrityHistoryKey(payload)

  if (
    maquinaId === undefined &&
    leituraId === undefined &&
    maquinaUpdatedAt === undefined &&
    !historicoKey
  ) {
    return ""
  }

  return [eventType, maquinaId, leituraId, maquinaUpdatedAt, historicoKey]
    .map((value) => value ?? "")
    .join("|")
}

export function getMachineUpdateTargetKey(payload) {
  const maquinaId = getMachineId(payload)

  if (maquinaId === undefined || maquinaId === null || maquinaId === "") {
    return getMachineUpdateEventKey(payload)
  }

  return `maquina:${maquinaId}`
}

export function buildRealtimeSocketOptions(accessToken) {
  return {
    auth: {
      token: accessToken,
      accessToken,
    },
    query: {
      token: accessToken,
    },
    transports: ["websocket", "polling"],
  }
}
