import test from "node:test"
import assert from "node:assert/strict"

import { groupAlertasByMaquina } from "../lib/alertas-grouping.js"
import { getDashboardPermissions, normalizeDashboardRole } from "../lib/dashboard-permissions.js"
import {
  getMaquinaAlertasStatus,
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
  getMaquinaUltimaLeituraExibicao,
  integridadeMaquinaFilterFn,
  maquinaTemSensores,
  withMaquinaAlertasStatus,
} from "../lib/maquinas-table.js"

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

  const tecnico = getDashboardPermissions("tecnico")
  assert.equal(tecnico.isTecnico, true)
  assert.equal(tecnico.canUpdateAlertStatus, true)
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
