"use client"

import { AlertTriangleIcon, CheckCircle2Icon, ClockIcon, CircleSlashIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

const SLA_STATUS_LABEL = {
  NO_PRAZO: "No prazo",
  EM_RISCO: "Em risco",
  ATRASADO: "Atrasado",
  CONCLUIDO_NO_PRAZO: "Concluído no prazo",
  CONCLUIDO_ATRASADO: "Concluído atrasado",
  NAO_APLICAVEL: "Não aplicável",
}

const SLA_STATUS_CLASS = {
  NO_PRAZO: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  EM_RISCO: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
  ATRASADO: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  CONCLUIDO_NO_PRAZO: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  CONCLUIDO_ATRASADO: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  NAO_APLICAVEL: "border-gray-200 bg-gray-50 text-gray-600 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
}

const SLA_STATUS_ICON = {
  NO_PRAZO: ClockIcon,
  EM_RISCO: AlertTriangleIcon,
  ATRASADO: AlertTriangleIcon,
  CONCLUIDO_NO_PRAZO: CheckCircle2Icon,
  CONCLUIDO_ATRASADO: AlertTriangleIcon,
  NAO_APLICAVEL: CircleSlashIcon,
}

const SLA_PRIORITY = [
  "ATRASADO",
  "EM_RISCO",
  "NO_PRAZO",
  "CONCLUIDO_ATRASADO",
  "CONCLUIDO_NO_PRAZO",
  "NAO_APLICAVEL",
]

function normalizeSlaStatus(value) {
  const status = String(value ?? "").trim().toUpperCase()
  return SLA_STATUS_LABEL[status] ? status : ""
}

export function getWorstSlaStatus(sla) {
  const statuses = [
    normalizeSlaStatus(sla?.atendimento?.status),
    normalizeSlaStatus(sla?.resolucao?.status),
  ].filter(Boolean)

  return SLA_PRIORITY.find((status) => statuses.includes(status)) || ""
}

export function hasSla(alerta) {
  return Boolean(alerta?.sla && typeof alerta.sla === "object")
}

export function SlaStatusBadge({ status, prefix, compact = false }) {
  const normalizedStatus = normalizeSlaStatus(status)

  if (!normalizedStatus) {
    return null
  }

  const Icon = SLA_STATUS_ICON[normalizedStatus] ?? ClockIcon
  const label = SLA_STATUS_LABEL[normalizedStatus] ?? normalizedStatus

  return (
    <Badge variant="outline" className={`px-1.5 text-xs ${SLA_STATUS_CLASS[normalizedStatus] ?? SLA_STATUS_CLASS.NAO_APLICAVEL}`}>
      <Icon className="mr-1 size-3" />
      {prefix && !compact ? `${prefix}: ` : null}
      {label}
    </Badge>
  )
}

export function SlaBadges({ sla, compact = false }) {
  if (!sla || typeof sla !== "object") {
    return null
  }

  return (
    <>
      <SlaStatusBadge status={sla.atendimento?.status} prefix="Atendimento" compact={compact} />
      <SlaStatusBadge status={sla.resolucao?.status} prefix="Resolucao" compact={compact} />
    </>
  )
}

export function SlaWorstBadge({ sla, prefix = "SLA" }) {
  const worstStatus = getWorstSlaStatus(sla)

  if (!worstStatus) {
    return null
  }

  return <SlaStatusBadge status={worstStatus} prefix={prefix} />
}
