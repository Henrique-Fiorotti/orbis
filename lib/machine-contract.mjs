import { z } from "zod"

const NullableObjectSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null
    }

    return value
  },
  z.record(z.string(), z.unknown()).nullable()
)

const MachineApiRecordSchema = z.object({
  id: z.any().optional(),
  maquinaId: z.any().optional(),
  nome: z.any().optional(),
  nomeMaquina: z.any().optional(),
  name: z.any().optional(),
  setor: z.any().optional(),
  area: z.any().optional(),
  linha: z.any().optional(),
  localizacao: z.any().optional(),
  tipo: z.any().optional(),
  tipoMaquina: z.any().optional(),
  categoria: z.any().optional(),
  modelo: z.any().optional(),
  criticidade: z.any().optional(),
  nivelCriticidade: z.any().optional(),
  prioridade: z.any().optional(),
  integridade: z.any().optional(),
  saude: z.any().optional(),
  healthScore: z.any().optional(),
  integridadeMedia: z.any().optional(),
  scoreEstabilidade: z.any().optional(),
  estabilidade: z.any().optional(),
  stabilityScore: z.any().optional(),
  score: z.any().optional(),
  status: z.any().optional(),
  estado: z.any().optional(),
  situacao: z.any().optional(),
  ultimaLeituraEm: z.any().optional(),
  ultimaAtualizacao: z.any().optional(),
  updatedAt: z.any().optional(),
  dataUltimaLeitura: z.any().optional(),
  sensores: z.any().optional(),
  totalSensores: z.any().optional(),
  quantidadeSensores: z.any().optional(),
  sensoresOnline: z.any().optional(),
  previsaoManutencao: z.any().optional(),
  previsaoFalha: z.any().optional(),
  dataFalhaPrevista: z.any().optional(),
  predictedFailureAt: z.any().optional(),
  janelaManuInicio: z.any().optional(),
  janelaManutencaoInicio: z.any().optional(),
  maintenanceWindowStart: z.any().optional(),
  janelaManuFim: z.any().optional(),
  janelaManutencaoFim: z.any().optional(),
  maintenanceWindowEnd: z.any().optional(),
  imagem: z.any().optional(),
  imagemUrl: z.any().optional(),
  foto: z.any().optional(),
  fotoUrl: z.any().optional(),
  caminhoImagem: z.any().optional(),
  imagePath: z.any().optional(),
  caminhoFoto: z.any().optional(),
  estadoPredicaoManutencao: NullableObjectSchema.optional().catch(null),
  estado_predicao_manutencao: NullableObjectSchema.optional().catch(null),
  predictionMaintenanceState: NullableObjectSchema.optional().catch(null),
  predictiveMaintenanceState: NullableObjectSchema.optional().catch(null),
  manutencaoPreditiva: NullableObjectSchema.optional().catch(null),
  preventivaPreditiva: NullableObjectSchema.optional().catch(null),
  predictiveMaintenance: NullableObjectSchema.optional().catch(null),
  predictedMaintenance: NullableObjectSchema.optional().catch(null),
}).passthrough()

export function parseMachineApiRecord(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const parsed = MachineApiRecordSchema.safeParse(raw)

  if (parsed.success) {
    return parsed.data
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("Payload de maquina fora do contrato", parsed.error.flatten())
  }

  return null
}
