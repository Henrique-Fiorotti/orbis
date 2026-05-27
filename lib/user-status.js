import { requestDashboardJson } from "@/lib/dashboard-api"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"

function getUsuarioId(usuario, registro) {
  const id = registro?.id ?? usuario?.id
  return id !== null && id !== undefined && id !== "" ? id : null
}

function getUsuarioNome(usuario, registro) {
  return String(registro?.nome ?? usuario?.nome ?? "").trim()
}

function getUsuarioTelefone(usuario, registro) {
  return String(registro?.telefone ?? usuario?.telefone ?? "").trim()
}

function getUsuarioEspecialidade(usuario, registro) {
  return String(registro?.especialidade ?? usuario?.especialidade ?? "").trim()
}

export function canToggleUserStatus(usuario) {
  const permissions = getDashboardPermissions(usuario)
  return permissions.isAdmin || permissions.isTecnico
}

export async function updateUserActiveStatus(accessToken, usuario, ativo, registro = null) {
  const permissions = getDashboardPermissions(usuario)
  const id = getUsuarioId(usuario, registro)
  const nome = getUsuarioNome(usuario, registro)
  const telefone = getUsuarioTelefone(usuario, registro)
  const especialidade = getUsuarioEspecialidade(usuario, registro)

  if (!id) {
    throw new Error("Nao foi possivel identificar seu usuario para atualizar o status.")
  }

  if (!nome) {
    throw new Error("Seu perfil precisa ter um nome para atualizar o status.")
  }

  return requestDashboardJson(`/usuarios/${id}`, accessToken, "o status do perfil", {
    method: "PUT",
    body: {
      nome,
      ...(telefone ? { telefone } : {}),
      ...(permissions.isTecnico && especialidade ? { especialidade } : {}),
      ativo,
    },
  })
}
