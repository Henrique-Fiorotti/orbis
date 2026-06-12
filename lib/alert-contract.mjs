import { z } from "zod"

const AlertApiRecordSchema = z.object({
  id: z.any().optional(),
  alertaId: z.any().optional(),
  tipo: z.any().optional(),
  tipoAlerta: z.any().optional(),
  maquinaId: z.any().optional(),
  maquina: z.any().optional(),
  maquinaNome: z.any().optional(),
  nomeMaquina: z.any().optional(),
  sensorId: z.any().optional(),
  sensor: z.any().optional(),
  sensorNome: z.any().optional(),
  nomeSensor: z.any().optional(),
  severidade: z.any().optional(),
  criticidade: z.any().optional(),
  status: z.any().optional(),
  estado: z.any().optional(),
  situacao: z.any().optional(),
  mensagem: z.any().optional(),
  descricao: z.any().optional(),
  criadoEm: z.any().optional(),
  createdAt: z.any().optional(),
  dataCriacao: z.any().optional(),
  atualizadoEm: z.any().optional(),
  updatedAt: z.any().optional(),
  ocorrencias: z.any().optional(),
  totalOcorrencias: z.any().optional(),
  quantidadeOcorrencias: z.any().optional(),
  ultimaOcorrenciaEm: z.any().optional(),
  ultimaOcorrencia: z.any().optional(),
  ultimaAtualizacao: z.any().optional(),
  eventos: z.any().optional(),
  manutencao: z.any().optional(),
  tecnicoId: z.any().optional(),
  tecnico: z.any().optional(),
  usuarioId: z.any().optional(),
  usuario: z.any().optional(),
  responsavelId: z.any().optional(),
  atendidoPorId: z.any().optional(),
  resolvidoPorId: z.any().optional(),
  tecnicoNome: z.any().optional(),
  nomeTecnico: z.any().optional(),
  usuarioNome: z.any().optional(),
  responsavelNome: z.any().optional(),
  atendidoPorNome: z.any().optional(),
  resolvidoPorNome: z.any().optional(),
  sla: z.any().optional(),
}).passthrough()

export function parseAlertApiRecord(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const parsed = AlertApiRecordSchema.safeParse(raw)

  if (parsed.success) {
    return parsed.data
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Payload de alerta fora do contrato", parsed.error.flatten())
  }

  return null
}
