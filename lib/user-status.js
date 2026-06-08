import { requestDashboardJson } from "@/lib/dashboard-api"
import { getDashboardPermissions } from "@/lib/dashboard-permissions"

export function canToggleUserStatus(usuario) {
  const permissions = getDashboardPermissions(usuario)
  return permissions.isAdmin || permissions.isTecnico
}

export async function updateUserActiveStatus(accessToken, usuario, ativo) {
  if (typeof ativo !== "boolean") {
    throw new Error("Informe se o usuário deve ficar ativo ou inativo.")
  }

  return requestDashboardJson("/usuarios/alterar-ativo", accessToken, "o status do perfil", {
    method: "PUT",
    body: { ativo },
  })
}
