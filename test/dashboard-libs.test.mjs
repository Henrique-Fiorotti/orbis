import test from "node:test"
import assert from "node:assert/strict"

import { groupAlertasByMaquina } from "../lib/alertas-grouping.js"
import { parseAlertApiRecord } from "../lib/alert-contract.mjs"
import { getDashboardPermissions, normalizeDashboardRole } from "../lib/dashboard-permissions.js"
import { parseMachineApiRecord } from "../lib/machine-contract.mjs"
import {
  getMaquinaAlertasStatus,
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
  getMaquinaUltimaLeituraExibicao,
  integridadeMaquinaFilterFn,
  maquinaTemSensores,
  withMaquinaAlertasStatus,
} from "../lib/maquinas-table.js"
import {
  getIntegrityTrendDataFromHistories,
  normalizeHistoricoIntegridadeCollection,
} from "../lib/orbis-dashboard.js"
import {
  buildPreventiveMaintenancePayload,
  normalizeManutencaoCollection,
} from "../lib/maintenance-contract.mjs"
import {
  getPredictiveMaintenanceStatus,
  normalizePredictiveMaintenanceState,
} from "../lib/prediction-contract.mjs"
import {
  parseSensorApiRecord,
  parseSensorReadingApiRecord,
} from "../lib/sensor-contract.mjs"

function createRow(value) {
  return {
    getValue() {
      return value
    },
  }
}

test("getDashboardPermissions separa permissoes de admin, tecnico, visitante e usuario desconhecido", () => {
  assert.equal(normalizeDashboardRole(" admin "), "ADMIN")

  const admin = getDashboardPermissions({ role: "ADMIN" })
  assert.equal(admin.isAdmin, true)
  assert.equal(admin.canManageMaquinas, true)
  assert.equal(admin.canViewAgendamentos, true)
  assert.equal(admin.canCommentAlertas, true)
  assert.equal(admin.canManagePreventiveMaintenances, false)

  const tecnico = getDashboardPermissions("tecnico")
  assert.equal(tecnico.isTecnico, true)
  assert.equal(tecnico.canUpdateAlertStatus, true)
  assert.equal(tecnico.canCommentAlertas, true)
  assert.equal(tecnico.canManagePreventiveMaintenances, true)
  assert.equal(tecnico.canManageMaquinas, false)
  assert.equal(tecnico.canViewAgendamentos, false)

  const visitante = getDashboardPermissions({ role: "VISITANTE" })
  assert.equal(visitante.isVisitante, true)
  assert.equal(visitante.canViewDashboard, true)
  assert.equal(visitante.canViewTecnicos, true)
  assert.equal(visitante.canViewAdmins, true)
  assert.equal(visitante.canViewAgendamentos, true)
  assert.equal(visitante.canManageMaquinas, false)
  assert.equal(visitante.canManageSensores, false)
  assert.equal(visitante.canManageTecnicos, false)
  assert.equal(visitante.canManageAdmins, false)
  assert.equal(visitante.canManageAgendamentos, false)
  assert.equal(visitante.canUpdateAlertStatus, false)
  assert.equal(visitante.canCommentAlertas, false)
  assert.equal(visitante.canManagePreventiveMaintenances, false)
  assert.equal(visitante.canEditOwnProfile, false)
  assert.equal(visitante.canSendReportsNow, true)

  const desconhecido = getDashboardPermissions(null)
  assert.equal(desconhecido.canViewDashboard, true)
  assert.equal(desconhecido.canEditOwnProfile, true)
  assert.equal(desconhecido.canManageSensores, false)
})

test("helpers de maquina calculam status de exibicao sem mutar dados", () => {
  const maquina = { id: 1, nome: "Motor A", sensores: 2, integridade: 82, ultimaLeituraEm: "2026-06-08T12:00:00.000Z" }
  const alertas = [
    { maquinaId: 1, maquinaNome: "Motor A", status: "EM_ANDAMENTO" },
    { maquinaId: 2, maquinaNome: "Motor B", status: "ATIVO" },
  ]

  assert.equal(maquinaTemSensores(maquina), true)
  assert.equal(getMaquinaAlertasStatus(maquina, alertas), "EM_ANDAMENTO")
  assert.equal(getMaquinaStatusExibicao({ ...maquina, statusAlertas: "EM_ANDAMENTO" }), "EM_ANDAMENTO")
  assert.equal(getMaquinaStatusExibicao({ sensores: 0 }), "SEM_SENSOR")
  assert.equal(getMaquinaIntegridadeExibicao(maquina), 82)
  assert.equal(getMaquinaIntegridadeExibicao({ ...maquina, sensores: 0 }), null)
  assert.equal(getMaquinaUltimaLeituraExibicao(maquina), "2026-06-08T12:00:00.000Z")

  const [comStatus] = withMaquinaAlertasStatus([maquina], alertas)
  assert.deepEqual(comStatus, { ...maquina, statusAlertas: "EM_ANDAMENTO" })
})

test("parseMachineApiRecord preserva aliases de maquina e limpa blocos preditivos invalidos", () => {
  const parsed = parseMachineApiRecord({
    maquinaId: "9",
    nomeMaquina: "Esteira 01",
    healthScore: "82",
    sensores: [{ id: 1 }, { id: 2 }],
    estado_predicao_manutencao: {
      validasConsecutivas: "2",
      ultimoEstadoPredicao: "PREVISAO_VALIDA",
    },
    predictedMaintenance: "manutencao invalida",
  })

  assert.equal(parsed.maquinaId, "9")
  assert.equal(parsed.nomeMaquina, "Esteira 01")
  assert.equal(parsed.healthScore, "82")
  assert.deepEqual(parsed.sensores, [{ id: 1 }, { id: 2 }])
  assert.deepEqual(parsed.estado_predicao_manutencao, {
    validasConsecutivas: "2",
    ultimoEstadoPredicao: "PREVISAO_VALIDA",
  })
  assert.equal(parsed.predictedMaintenance, null)
  assert.equal(parseMachineApiRecord(null), null)
  assert.equal(parseMachineApiRecord([]), null)
})

test("parseSensorApiRecord preserva aliases de sensor e rejeita payload invalido", () => {
  const parsed = parseSensorApiRecord({
    sensorId: "15",
    nomeSensor: "Temperatura A",
    idMaquina: "9",
    nomeMaquina: "Esteira 01",
    temperatura: { valorAtual: "42" },
    vibracao: { valorAtual: "1.2" },
  })

  assert.equal(parsed.sensorId, "15")
  assert.equal(parsed.nomeSensor, "Temperatura A")
  assert.equal(parsed.idMaquina, "9")
  assert.deepEqual(parsed.temperatura, { valorAtual: "42" })
  assert.equal(parseSensorApiRecord(null), null)
  assert.equal(parseSensorApiRecord([]), null)
})

test("parseSensorReadingApiRecord preserva aliases de leitura de sensor", () => {
  const parsed = parseSensorReadingApiRecord({
    sensor_id: "15",
    temperature: "41.5",
    vibration: "1.2",
    timestamp: "2026-06-12T10:00:00.000Z",
  })

  assert.equal(parsed.sensor_id, "15")
  assert.equal(parsed.temperature, "41.5")
  assert.equal(parsed.vibration, "1.2")
  assert.equal(parsed.timestamp, "2026-06-12T10:00:00.000Z")
  assert.equal(parseSensorReadingApiRecord("invalid"), null)
})

test("parseAlertApiRecord preserva aliases de alerta e rejeita payload invalido", () => {
  const parsed = parseAlertApiRecord({
    alertaId: "44",
    tipoAlerta: "instabilidade",
    maquina: { id: 9, nome: "Esteira 01" },
    sensor: { id: 15, nome: "Temperatura A" },
    descricao: "Variacao detectada",
    eventos: [{ tipo: "CRIADO" }],
  })

  assert.equal(parsed.alertaId, "44")
  assert.equal(parsed.tipoAlerta, "instabilidade")
  assert.deepEqual(parsed.maquina, { id: 9, nome: "Esteira 01" })
  assert.deepEqual(parsed.eventos, [{ tipo: "CRIADO" }])
  assert.equal(parseAlertApiRecord(undefined), null)
  assert.equal(parseAlertApiRecord([]), null)
})

test("integridadeMaquinaFilterFn classifica faixas de integridade", () => {
  assert.equal(integridadeMaquinaFilterFn(createRow(90), "integridade", "estavel"), true)
  assert.equal(integridadeMaquinaFilterFn(createRow(62), "integridade", "atencao"), true)
  assert.equal(integridadeMaquinaFilterFn(createRow(49), "integridade", "critico"), true)
  assert.equal(integridadeMaquinaFilterFn(createRow(null), "integridade", "estavel"), false)
  assert.equal(integridadeMaquinaFilterFn(createRow(90), "integridade", ""), true)
})

test("groupAlertasByMaquina agrega alertas por maquina e preserva prioridade operacional", () => {
  const grupos = groupAlertasByMaquina([
    {
      id: 1,
      maquinaId: 10,
      maquinaNome: "Motor A",
      sensorNome: "Temperatura",
      tipo: "LIMITE_ULTRAPASSADO",
      status: "RESOLVIDO",
      ocorrencias: 2,
      ultimaOcorrenciaEm: "2026-06-08T12:00:00.000Z",
      duplicado: true,
    },
    {
      id: 2,
      maquinaId: 10,
      maquinaNome: "Motor A",
      sensorNome: "Vibracao",
      tipo: "INSTABILIDADE",
      status: "EM_ANDAMENTO",
      ocorrencias: 1,
      ultimaOcorrenciaEm: "2026-06-08T11:00:00.000Z",
    },
    {
      id: 3,
      maquinaId: null,
      maquinaNome: "",
      sensorNome: "Pressao",
      tipo: "TENDENCIA_CURTA",
      status: "ATIVO",
      ultimaOcorrenciaEm: "2026-06-08T10:00:00.000Z",
    },
  ])

  const motorA = grupos.find((grupo) => grupo.groupId === "id:10")
  assert.equal(motorA.maquinaNome, "Motor A")
  assert.equal(motorA.totalAlertas, 2)
  assert.equal(motorA.totalOcorrencias, 3)
  assert.deepEqual(motorA.tipos, ["LIMITE_ULTRAPASSADO", "INSTABILIDADE"])
  assert.deepEqual(motorA.sensores, ["Temperatura", "Vibracao"])
  assert.equal(motorA.temRepetidos, true)
  assert.equal(motorA.principalStatus, "EM_ANDAMENTO")

  const semMaquina = grupos.find((grupo) => grupo.groupId === "sem-maquina")
  assert.equal(semMaquina.maquinaNome, "Máquina não informada")
  assert.equal(semMaquina.totalOcorrencias, 1)
})

test("historico de integridade aceita payload envelopado e aliases do backend", () => {
  const maquina = { id: 10, nome: "Motor A", integridade: 81 }
  const segundaMaquina = { id: 11, nome: "Motor B", integridade: 90 }
  const historico = normalizeHistoricoIntegridadeCollection({
    historico: [
      {
        id: 1,
        maquina_id: 10,
        integridade_media: 72.4,
        registrado_em: "2026-06-08T12:00:00.000Z",
      },
      {
        id: 2,
        maquinaId: 10,
        health_score: 76,
        leituraEm: "2026-06-09T12:00:00.000Z",
      },
    ],
  }, maquina)

  assert.equal(historico.length, 2)
  assert.equal(historico[0].date, "2026-06-08")
  assert.equal(historico[0].integridade, 72)
  assert.equal(historico[1].date, "2026-06-09")
  assert.equal(historico[1].integridade, 76)

  const segundoHistorico = normalizeHistoricoIntegridadeCollection({
    historico_integridade: [
      {
        maquinaId: 11,
        integridadeAtual: 86,
        dataHora: "2026-06-09T13:00:00.000Z",
      },
    ],
  }, segundaMaquina)
  const serie = getIntegrityTrendDataFromHistories([
    { maquina, historico },
    { maquina: segundaMaquina, historico: segundoHistorico },
  ], [maquina, segundaMaquina], "2026-06-09")

  assert.equal(serie.at(-1).date, "2026-06-09")
  assert.equal(serie.at(-1).timestamp, Date.parse("2026-06-09T13:00:00.000Z"))
  assert.equal(serie.at(-1).integridade, 81)
  assert.equal(serie.at(-1).maquinas, 2)
})

test("normalizeManutencaoCollection preserva preventiva agendada criada por predicao", () => {
  const [manutencao] = normalizeManutencaoCollection({
    dados: [
      {
        id: 12,
        alertaId: null,
        maquinaId: 9,
        usuarioId: null,
        tipo: "PREVENTIVA",
        titulo: "Preventiva preditiva - Esteira 01",
        prioridade: "ALTA",
        origem: "PREDICAO",
        observacao: "Manutencao preventiva criada automaticamente pela predicao.",
        status: "AGENDADA",
        dataAgendada: "2026-06-20T14:00:00.000Z",
        janelaAgendadaInicio: "2026-06-20T14:00:00.000Z",
        janelaAgendadaFim: "2026-06-21T14:00:00.000Z",
        concluidaEm: null,
        cumprimentoAgendamento: "NAO_APLICAVEL",
        diasDesvioAgendamento: null,
        metadataPredicao: {
          estadoPredicao: "PREVISAO_VALIDA",
          fonteDecisao: "REGRESSAO_LINEAR",
          urgencia: "ALTA",
          motivo: "previsao_linear_valida",
          previsaoManutencao: "2026-06-30T10:00:00.000Z",
        },
        maquina: { id: 9, nome: "Esteira 01" },
        usuario: null,
        alerta: null,
      },
    ],
  })

  assert.equal(manutencao.status, "AGENDADA")
  assert.equal(manutencao.titulo, "Preventiva preditiva - Esteira 01")
  assert.equal(manutencao.prioridade, "ALTA")
  assert.equal(manutencao.origem, "PREDICAO")
  assert.equal(manutencao.usuario, null)
  assert.equal(manutencao.alerta, null)
  assert.equal(manutencao.dataAgendada, "2026-06-20T14:00:00.000Z")
  assert.equal(manutencao.janelaAgendadaInicio, "2026-06-20T14:00:00.000Z")
  assert.equal(manutencao.janelaAgendadaFim, "2026-06-21T14:00:00.000Z")
  assert.equal(manutencao.concluidaEm, null)
  assert.equal(manutencao.cumprimentoAgendamento, "NAO_APLICAVEL")
  assert.equal(manutencao.diasDesvioAgendamento, null)
  assert.deepEqual(manutencao.metadataPredicao, {
    estadoPredicao: "PREVISAO_VALIDA",
    fonteDecisao: "REGRESSAO_LINEAR",
    urgencia: "ALTA",
    motivo: "previsao_linear_valida",
    previsaoManutencao: "2026-06-30T10:00:00.000Z",
  })
})

test("normalizeManutencaoCollection padroniza metadataPredicao com Zod", () => {
  const [manutencao] = normalizeManutencaoCollection({
    manutencoes: [
      {
        id: "21",
        maquinaId: "9",
        tipo: "preventiva",
        origem: "predicao",
        status: "programada",
        predictionMetadata: {
          estadoPredicao: "previsao valida",
          fonteDecisao: "regressao linear",
          urgencia: "alta",
          motivo: " previsao_linear_valida ",
          previsaoManutencao: Date.parse("2026-06-30T10:00:00.000Z"),
          contextoExtra: { janelaHoras: 24 },
        },
      },
    ],
  })

  assert.equal(manutencao.id, 21)
  assert.equal(manutencao.status, "AGENDADA")
  assert.equal(manutencao.origem, "PREDICAO")
  assert.deepEqual(manutencao.metadataPredicao, {
    estadoPredicao: "PREVISAO_VALIDA",
    fonteDecisao: "REGRESSAO_LINEAR",
    urgencia: "ALTA",
    motivo: "previsao_linear_valida",
    previsaoManutencao: "2026-06-30T10:00:00.000Z",
    contextoExtra: { janelaHoras: 24 },
  })
})

test("normalizeManutencaoCollection ignora registros invalidos sem quebrar a lista", () => {
  const manutencoes = normalizeManutencaoCollection({
    dados: [
      null,
      [],
      {
        id: 31,
        maquinaId: 9,
        tipo: "PREVENTIVA",
        status: "AGENDADA",
        metadataPredicao: "metadata invalida",
      },
    ],
  })

  assert.equal(manutencoes.length, 1)
  assert.equal(manutencoes[0].id, 31)
  assert.equal(manutencoes[0].metadataPredicao, null)
})

test("normalizePredictiveMaintenanceState preserva estado de agendamento preditivo seguro", () => {
  const estado = normalizePredictiveMaintenanceState({
    validasConsecutivas: "2",
    invalidasConsecutivas: 0,
    ultimaPredicaoEm: Date.parse("2026-06-11T19:00:00.000Z"),
    ultimaDataAgendada: "2026-06-25T10:00:00.000Z",
    ultimaPrevisaoManutencao: "2026-06-30T10:00:00.000Z",
    estadoPredicao: "previsao valida",
    ultimoMotivo: "previsao_linear_valida",
    scoreConfianca: "93",
    criteriosAprovados: null,
    criteriosReprovados: ["preventivaManualProxima", ""],
    bloqueadaPorPreventivaManual: "sim",
    preventivaManualProximaId: "77",
    modeloIntegridade: {
      r2: "0.86",
      slope: "-1.25",
      pontosUsados: "6",
      janelaHorasCoberta: 6,
    },
  })

  assert.equal(estado.validasConsecutivas, 2)
  assert.equal(estado.ultimaPredicaoEm, "2026-06-11T19:00:00.000Z")
  assert.equal(estado.ultimoEstadoPredicao, "PREVISAO_VALIDA")
  assert.equal(estado.scoreConfianca, 93)
  assert.deepEqual(estado.criteriosAprovados, [])
  assert.equal(estado.bloqueadaPorPreventivaManual, true)
  assert.deepEqual(estado.criteriosReprovados, ["preventivaManualProxima"])
  assert.equal(estado.modeloIntegridade.r2, 0.86)
  assert.equal(estado.modeloIntegridade.pontosUsados, 6)
})

test("getPredictiveMaintenanceStatus diferencia confirmacao, bloqueio e preventiva existente", () => {
  assert.deepEqual(getPredictiveMaintenanceStatus({
    estado: null,
    manutencaoPreditiva: null,
  }), {
    type: "sem_dados",
    tone: "muted",
    badge: "Sem dados",
    title: "Sem predicao suficiente",
    description: "Ainda nao ha dados suficientes para agendamento preditivo.",
  })

  assert.deepEqual(getPredictiveMaintenanceStatus({
    estado: {
      validasConsecutivas: 2,
      ultimoEstadoPredicao: "PREVISAO_VALIDA",
      bloqueadaPorPreventivaManual: false,
    },
  }), {
    type: "confirmacao",
    tone: "attention",
    badge: "2/3",
    title: "Predicao em confirmacao",
    description: "Predicao em confirmacao: 2/3 leituras validas.",
  })

  assert.equal(getPredictiveMaintenanceStatus({
    estado: {
      validasConsecutivas: 3,
      ultimoEstadoPredicao: "PREVISAO_VALIDA",
      bloqueadaPorPreventivaManual: true,
    },
  }).type, "bloqueada")

  assert.equal(getPredictiveMaintenanceStatus({
    estado: null,
    manutencaoPreditiva: { status: "AGENDADA" },
  }).description, "Preventiva preditiva agendada.")
})

test("buildPreventiveMaintenancePayload monta preventiva manual imediata ou agendada", () => {
  assert.deepEqual(buildPreventiveMaintenancePayload({
    maquinaId: "9",
    titulo: "Inspecao dos rolamentos",
    prioridade: "URGENTE",
    observacao: "Verificar vibracao e temperatura.",
  }), {
    tipo: "PREVENTIVA",
    maquinaId: 9,
    titulo: "Inspecao dos rolamentos",
    prioridade: "URGENTE",
    observacao: "Verificar vibracao e temperatura.",
  })

  assert.deepEqual(buildPreventiveMaintenancePayload({
    maquinaId: 9,
    titulo: "",
    prioridade: "INVALIDA",
    dataAgendada: "2026-06-20T14:00:00.000Z",
    observacao: "Planejar troca preventiva.",
  }), {
    tipo: "PREVENTIVA",
    maquinaId: 9,
    dataAgendada: "2026-06-20T14:00:00.000Z",
    observacao: "Planejar troca preventiva.",
  })

  assert.throws(
    () => buildPreventiveMaintenancePayload({ maquinaId: 9, observacao: "" }),
    /Informe uma observacao/
  )
})
