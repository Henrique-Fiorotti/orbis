import { z } from "zod"

const SensorApiRecordSchema = z.object({
  id: z.any().optional(),
  sensorId: z.any().optional(),
  nome: z.any().optional(),
  nomeSensor: z.any().optional(),
  name: z.any().optional(),
  tipo: z.any().optional(),
  tipoSensor: z.any().optional(),
  categoria: z.any().optional(),
  maquinaId: z.any().optional(),
  idMaquina: z.any().optional(),
  maquinaNome: z.any().optional(),
  nomeMaquina: z.any().optional(),
  maquina: z.any().optional(),
  status: z.any().optional(),
  estado: z.any().optional(),
  situacao: z.any().optional(),
  active: z.any().optional(),
  ativo: z.any().optional(),
  ultimaLeituraEm: z.any().optional(),
  ultimaAtualizacao: z.any().optional(),
  dataUltimaLeitura: z.any().optional(),
  limiteTemperatura: z.any().optional(),
  temperaturaMax: z.any().optional(),
  temperaturaMaxima: z.any().optional(),
  idealTemperatura: z.any().optional(),
  temperaturaIdeal: z.any().optional(),
  limiteVibracao: z.any().optional(),
  vibracaoMax: z.any().optional(),
  vibracaoMaxima: z.any().optional(),
  idealVibracao: z.any().optional(),
  vibracaoIdeal: z.any().optional(),
  temperatura: z.any().optional(),
  vibracao: z.any().optional(),
  ultimaTemperatura: z.any().optional(),
  ultimaVibracao: z.any().optional(),
}).passthrough()

const SensorReadingApiRecordSchema = z.object({
  id: z.any().optional(),
  leituraId: z.any().optional(),
  sensorId: z.any().optional(),
  sensor_id: z.any().optional(),
  sensor: z.any().optional(),
  temperatura: z.any().optional(),
  temperature: z.any().optional(),
  temp: z.any().optional(),
  vibracao: z.any().optional(),
  vibracao_rms: z.any().optional(),
  vibration: z.any().optional(),
  criadoEm: z.any().optional(),
  timestamp: z.any().optional(),
  createdAt: z.any().optional(),
}).passthrough()

export function parseSensorApiRecord(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const parsed = SensorApiRecordSchema.safeParse(raw)

  if (parsed.success) {
    return parsed.data
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Payload de sensor fora do contrato", parsed.error.flatten())
  }

  return null
}

export function parseSensorReadingApiRecord(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const parsed = SensorReadingApiRecordSchema.safeParse(raw)

  if (parsed.success) {
    return parsed.data
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Payload de leitura de sensor fora do contrato", parsed.error.flatten())
  }

  return null
}
