export const REALTIME_SENSOR_READING_EVENT = "orbis-sensor-reading"

export const SENSOR_READING_SOCKET_EVENTS = ["novaLeitura", "nova-leitura"]

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
