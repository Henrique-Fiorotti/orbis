export const REALTIME_SENSOR_READING_EVENT = "orbis-sensor-reading"

export const SENSOR_READING_SOCKET_EVENTS = ["novaLeitura", "nova-leitura"]
export const SENSOR_READING_DEDUP_WINDOW_MS = 1500

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
