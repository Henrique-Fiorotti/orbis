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

  return {
    role: normalizedRole,
    isAdmin,
    isTecnico,
    canViewDashboard: true,
    canViewTecnicos: isAdmin,
    canManageMaquinas: isAdmin,
    canManageSensores: isAdmin,
    canManageTecnicos: isAdmin,
    canCreateAlertas: isAdmin,
    canDeleteAlertas: isAdmin,
    canUpdateAlertStatus: isAdmin || isTecnico,
    canEditOwnProfile: true,
  }
}
