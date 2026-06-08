"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CircleCheckIcon,
  CircleXIcon,
  ShieldAlertIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { tempoRelativo } from "@/lib/utils"

const TIPO_ALERTA_LABEL = {
  LIMITE_ULTRAPASSADO: "Limite ultrapassado",
  TENDENCIA_CURTA: "Tendencia curta",
  TENDENCIA_LONGA: "Tendencia longa",
  DEGRADACAO_ACELERADA: "Degradacao acelerada",
  INSTABILIDADE: "Instabilidade",
}

const STATUS_ALERTA_LABEL = {
  ATIVO: "Em aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
}

const SEVERIDADE_CLASS = {
  ALTA: "bg-red-100 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
  BAIXA: "bg-green-100 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
}

const STATUS_CLASS = {
  ATIVO: "bg-red-50 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  EM_ANDAMENTO: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
  RESOLVIDO: "bg-green-50 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
  CANCELADO: "bg-gray-100 text-gray-500 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
}

const STATUS_ICON = {
  ATIVO: ShieldAlertIcon,
  EM_ANDAMENTO: AlertTriangleIcon,
  RESOLVIDO: CircleCheckIcon,
  CANCELADO: CircleXIcon,
}

function getInitials(value) {
  return String(value ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T"
}

function getUltimaOcorrencia(alerta) {
  return alerta?.ultimaOcorrenciaEm || alerta?.atualizadoEm || alerta?.criadoEm || ""
}

function formatSeverity(value) {
  return value ? value.charAt(0) + value.slice(1).toLowerCase() : "Media"
}

function TipoAlertaBadge({ value }) {
  return (
    <Badge variant="outline" className="border-purple-200 bg-purple-50 px-1.5 text-xs font-normal text-[#3B2867] dark:border-primary/40 dark:bg-primary/10 dark:text-primary-foreground">
      {TIPO_ALERTA_LABEL[value] ?? value ?? "Alerta"}
    </Badge>
  )
}

function SeveridadeBadge({ value }) {
  return (
    <Badge variant="outline" className={`px-1.5 text-xs ${SEVERIDADE_CLASS[value] ?? SEVERIDADE_CLASS.MEDIA}`}>
      {formatSeverity(value)}
    </Badge>
  )
}

function StatusAlertaBadge({ value }) {
  const Icon = STATUS_ICON[value] ?? ShieldAlertIcon

  return (
    <Badge variant="outline" className={`px-1.5 text-xs ${STATUS_CLASS[value] ?? STATUS_CLASS.ATIVO}`}>
      <Icon className="mr-1 size-3" />
      {STATUS_ALERTA_LABEL[value] ?? value ?? "Em aberto"}
    </Badge>
  )
}

function OcorrenciasBadge({ value }) {
  return (
    <Badge variant="outline" className="px-3 text-xs text-muted-foreground">
      {Math.max(Number(value) || 1, 1)} ocorr.
    </Badge>
  )
}

function TecnicoResponsavelCard({ tecnico }) {
  if (!tecnico) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
        Nenhum técnico responsável informado.
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="size-12">
          <AvatarImage src={tecnico.foto || undefined} alt={tecnico.nome} />
          <AvatarFallback className="bg-purple-100 font-semibold text-purple-700 dark:bg-primary/20 dark:text-primary-foreground">
            {getInitials(tecnico.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#3B2867] dark:text-white">{tecnico.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{tecnico.especialidade || "Sem especialidade informada"}</p>
            </div>
            <Badge variant="outline" className="border-green-200 bg-green-50 px-1.5 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
              Responsável
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border bg-muted/25 px-2.5 py-2">
              <span className="text-muted-foreground">E-mail</span>
              <p className="truncate font-medium text-foreground">{tecnico.email || "Não informado"}</p>
            </div>
            <div className="min-w-0 rounded-lg border bg-muted/25 px-2.5 py-2">
              <span className="text-muted-foreground">Telefone</span>
              <p className="truncate font-medium text-foreground">{tecnico.telefone || "Não informado"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AlertaDetailsPanel({ alerta, tecnico, afterMessage = null, showTecnico, className = "" }) {
  if (!alerta) {
    return null
  }

  const shouldShowTecnico = showTecnico ?? (
    alerta.status === "EM_ANDAMENTO" ||
    alerta.status === "RESOLVIDO" ||
    Boolean(tecnico)
  )

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="rounded-xl border bg-linear-to-br from-primary/10 via-card to-card p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">{alerta.maquinaNome}</span>
            <span className="line-clamp-2 text-sm text-muted-foreground">{alerta.sensorNome}</span>
          </div>
          <StatusAlertaBadge value={alerta.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <TipoAlertaBadge value={alerta.tipo} />
          <SeveridadeBadge value={alerta.severidade} />
          <OcorrenciasBadge value={alerta.ocorrencias} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Máquina</Label>
          <span className="text-sm font-medium">{alerta.maquinaNome}</span>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Sensor</Label>
          <span className="text-sm font-medium">{alerta.sensorNome}</span>
        </div>
      </div>

      {shouldShowTecnico ? <TecnicoResponsavelCard tecnico={tecnico} /> : null}

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Mensagem</Label>
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground">
          {alerta.mensagem || "Mensagem não informada."}
        </p>
      </div>

      {afterMessage}

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Criado em</Label>
        <span className="text-sm">{tempoRelativo(alerta.criadoEm)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Ultima ocorrencia</Label>
          <span className="text-sm">{tempoRelativo(getUltimaOcorrencia(alerta))}</span>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Ocorrencias</Label>
          <span className="text-sm font-semibold">{Math.max(Number(alerta.ocorrencias) || 1, 1)}</span>
        </div>
      </div>
    </div>
  )
}
