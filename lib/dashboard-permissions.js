// @ts-check

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeDashboardRole(value) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().toUpperCase()
}

/**
 * @param {unknown} usuarioOuRole
 * @returns {import("@/lib/orbis-types").DashboardPermissions}
 */
export function getDashboardPermissions(usuarioOuRole) {
  const role =
    typeof usuarioOuRole === "string"
      ? usuarioOuRole
      : usuarioOuRole && typeof usuarioOuRole === "object" && "role" in usuarioOuRole
        ? usuarioOuRole.role
        : ""

  const normalizedRole = normalizeDashboardRole(role)
  const isAdmin = normalizedRole === "ADMIN"
  const isTecnico = normalizedRole === "TECNICO"
  const isVisitante = normalizedRole === "VISITANTE"
  const canViewAdminSurface = isAdmin || isVisitante

  return {
    role: normalizedRole,
    isAdmin,
    isTecnico,
    isVisitante,
    canViewDashboard: true,
    canViewTecnicos: canViewAdminSurface || isTecnico,
    canViewAdmins: canViewAdminSurface || isTecnico,
    canViewAgendamentos: canViewAdminSurface,
    canManageMaquinas: isAdmin,
    canManageSensores: isAdmin,
    canManageTecnicos: isAdmin,
    canManageAdmins: isAdmin,
    canManageAgendamentos: isAdmin,
    canCreateAlertas: isAdmin,
    canDeleteAlertas: isAdmin,
    canUpdateAlertStatus: isAdmin || isTecnico,
    canEditOwnProfile: !isVisitante,
    canSendReportsNow: isAdmin || isVisitante,
  }
}
