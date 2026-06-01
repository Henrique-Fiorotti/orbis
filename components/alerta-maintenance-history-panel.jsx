"use client"

import * as React from "react"
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  Loader2Icon,
  MessageSquareTextIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  WrenchIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { extractCollection } from "@/lib/dashboard-api"

const EVENTO_STATUS_LABEL = {
  ATIVO: "Em aberto",
  EM_ANDAMENTO: "Em andamento",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
  ENCERRADO_SEM_SOLUCAO: "Sem solucao",
}

const EVENTOS_COM_MANUTENCAO = new Set(["ACEITO", "ATUALIZADO", "REABERTO", "RESOLVIDO", "CANCELADO"])

function normalizeUppercase(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
}

function normalizeDateValue(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : ""
}

function formatAbsoluteDate(value) {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return "Data nao informada"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatTimeOnly(value) {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  }).format(date)
}

function isSameLocalDate(firstValue, secondValue) {
  const firstDate = new Date(firstValue)
  const secondDate = new Date(secondValue)

  if (!Number.isFinite(firstDate.getTime()) || !Number.isFinite(secondDate.getTime())) {
    return false
  }

  return firstDate.toLocaleDateString("pt-BR") === secondDate.toLocaleDateString("pt-BR")
}

function formatTimelineDateRange(item) {
  if (!item.ultimoCriadoEm || item.ultimoCriadoEm === item.criadoEm) {
    return formatAbsoluteDate(item.criadoEm)
  }

  if (isSameLocalDate(item.criadoEm, item.ultimoCriadoEm)) {
    return `${formatAbsoluteDate(item.criadoEm)} - ${formatTimeOnly(item.ultimoCriadoEm)}`
  }

  return `${formatAbsoluteDate(item.criadoEm)} - ${formatAbsoluteDate(item.ultimoCriadoEm)}`
}

function getUsuarioResumo(source) {
  const usuario = source?.usuario ?? source?.tecnico ?? source?.responsavel

  if (usuario && typeof usuario === "object") {
    return {
      id: usuario.id ?? source?.usuarioId ?? source?.tecnicoId ?? null,
      nome: usuario.nome || usuario.name || "Tecnico nao informado",
      role: normalizeUppercase(usuario.role),
    }
  }

  return {
    id: source?.usuarioId ?? source?.tecnicoId ?? null,
    nome: source?.usuarioNome || source?.tecnicoNome || source?.nomeTecnico || "Tecnico nao informado",
    role: "",
  }
}

function getEventoUsuario(source) {
  if (source?.usuario && typeof source.usuario === "object") {
    return getUsuarioResumo(source)
  }

  if (source?.manutencao?.usuario && typeof source.manutencao.usuario === "object") {
    return getUsuarioResumo(source.manutencao)
  }

  const usuarioId = source?.usuarioId ?? source?.manutencao?.usuarioId

  if (usuarioId) {
    return {
      id: usuarioId,
      nome: source?.usuarioNome || source?.tecnicoNome || source?.manutencao?.usuarioNome || "Tecnico nao informado",
      role: "TECNICO",
    }
  }

  return { id: null, nome: "Sistema", role: "" }
}

function normalizeManutencao(item) {
  if (!item || typeof item !== "object") {
    return null
  }

  const id = Number(item.id ?? item.manutencaoId)
  const alertaId = Number(item.alertaId ?? item.alerta?.id)

  if (!Number.isFinite(id)) {
    return null
  }

  return {
    id,
    alertaId: Number.isFinite(alertaId) ? alertaId : null,
    usuario: getUsuarioResumo(item),
    observacao: String(item.observacao ?? item.descricao ?? "").trim(),
    status: normalizeUppercase(item.status || "EM_ANDAMENTO"),
    criadoEm: normalizeDateValue(item.criadoEm ?? item.createdAt ?? item.dataCriacao),
  }
}

export function normalizeEventoAlerta(item) {
  if (!item || typeof item !== "object") {
    return null
  }

  const id = Number(item.id ?? item.eventoId)
  const manutencaoId = Number(item.manutencaoId ?? item.manutencao?.id)
  const alertaId = Number(item.alertaId ?? item.alerta?.id)
  const manutencao = item.manutencao ? normalizeManutencao(item.manutencao) : null

  return {
    id: Number.isFinite(id) ? id : null,
    alertaId: Number.isFinite(alertaId) ? alertaId : null,
    manutencaoId: Number.isFinite(manutencaoId) ? manutencaoId : null,
    manutencao,
    usuario: getEventoUsuario(item),
    tipo: normalizeUppercase(item.tipo),
    statusAnterior: normalizeUppercase(item.statusAnterior),
    statusNovo: normalizeUppercase(item.statusNovo ?? item.status),
    descricao: String(item.descricao ?? item.observacao ?? item.mensagem ?? "").trim(),
    mensagem: String(item.mensagem ?? "").trim(),
    criadoEm: normalizeDateValue(item.criadoEm ?? item.createdAt ?? item.dataCriacao),
  }
}

export function extractEventosFromAlertaPayload(payload) {
  const candidates = [
    payload?.eventos,
    payload?.dados?.eventos,
    payload?.data?.eventos,
    payload?.resultado?.eventos,
  ]
  const eventos = candidates.find(Array.isArray)

  if (eventos) {
    return eventos
  }

  return extractCollection(payload)
}

function compareTimelineDate(a, b) {
  return (Date.parse(a.criadoEm) || 0) - (Date.parse(b.criadoEm) || 0)
}

function getManutencaoStatusTone(status) {
  if (status === "RESOLVIDO") {
    return "success"
  }

  if (status === "ENCERRADO_SEM_SOLUCAO" || status === "ATIVO" || status === "REABERTO") {
    return "warning"
  }

  return "active"
}

function getTimelineIcon(tipo) {
  if (tipo === "alerta") return ShieldAlertIcon
  if (tipo === "inicio") return WrenchIcon
  if (tipo === "encerramento") return CircleCheckIcon
  if (tipo === "cancelamento") return CircleXIcon
  if (tipo === "sem_solucao") return RotateCcwIcon
  return MessageSquareTextIcon
}

function createTimelineItem({ tipo, titulo, usuario, criadoEm, descricao, status, mensagem, manutencaoId = null }) {
  return {
    key: `${tipo}-${criadoEm || "sem-data"}-${titulo}-${descricao || ""}`,
    tipo,
    titulo,
    manutencaoId,
    usuario: usuario?.nome || "Sistema",
    criadoEm,
    descricao,
    mensagem,
    status,
    repeticoes: 1,
    ultimoCriadoEm: criadoEm,
  }
}

function normalizeTimelineText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase()
}

function getTimelineGroupKey(item) {
  return [
    item.tipo,
    item.manutencaoId ?? "sem-manutencao",
    item.titulo,
    item.usuario,
    item.status,
    normalizeTimelineText(item.descricao),
  ].join("|")
}

function compactRepeatedTimelineItems(items) {
  const groupedItems = []
  const groupedIndexes = new Map()

  for (const item of items) {
    const groupKey = getTimelineGroupKey(item)
    const existingIndex = groupedIndexes.get(groupKey)

    if (existingIndex !== undefined) {
      const existingItem = groupedItems[existingIndex]
      groupedItems[existingIndex] = {
        ...existingItem,
        key: `${existingItem.key}-x${existingItem.repeticoes + 1}`,
        repeticoes: existingItem.repeticoes + 1,
        ultimoCriadoEm: item.ultimoCriadoEm || item.criadoEm || existingItem.ultimoCriadoEm,
      }
      continue
    }

    groupedIndexes.set(groupKey, groupedItems.length)
    groupedItems.push(item)
  }

  return groupedItems
}

function getEventoDescricao(evento) {
  return evento.descricao || evento.manutencao?.observacao || evento.mensagem || ""
}

function getEventoStatus(evento) {
  if (evento.tipo === "REABERTO") return "ENCERRADO_SEM_SOLUCAO"
  if (evento.tipo === "ACEITO") return "EM_ANDAMENTO"
  return evento.statusNovo || evento.manutencao?.status || ""
}

function isEventoDeManutencao(evento) {
  return EVENTOS_COM_MANUTENCAO.has(evento.tipo) && Boolean(evento.manutencaoId || evento.manutencao)
}

function createTimelineItemFromEvento(evento) {
  if (evento.tipo === "CRIADO") {
    return createTimelineItem({
      tipo: "alerta",
      titulo: "Alerta aberto",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: evento.statusNovo || "ATIVO",
    })
  }

  if (evento.tipo === "ACEITO") {
    return createTimelineItem({
      tipo: "inicio",
      titulo: "Manutencao iniciada",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm || evento.manutencao?.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "EM_ANDAMENTO",
      manutencaoId: evento.manutencaoId,
    })
  }

  if (evento.tipo === "REABERTO") {
    return createTimelineItem({
      tipo: "sem_solucao",
      titulo: "Manutencao encerrada sem solucao",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "ENCERRADO_SEM_SOLUCAO",
      manutencaoId: evento.manutencaoId,
    })
  }

  if (evento.tipo === "RESOLVIDO") {
    return createTimelineItem({
      tipo: "encerramento",
      titulo: "Manutencao encerrada",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "RESOLVIDO",
      manutencaoId: evento.manutencaoId,
    })
  }

  if (evento.tipo === "CANCELADO") {
    return createTimelineItem({
      tipo: "cancelamento",
      titulo: "Alerta cancelado",
      usuario: evento.usuario,
      criadoEm: evento.criadoEm,
      descricao: getEventoDescricao(evento),
      status: "CANCELADO",
      manutencaoId: evento.manutencaoId,
    })
  }

  const isManutencao = isEventoDeManutencao(evento)

  return createTimelineItem({
    tipo: isManutencao ? "atualizacao" : "alerta_atualizado",
    titulo: isManutencao ? "Atualizacao da manutencao" : "Alerta atualizado",
    usuario: evento.usuario,
    criadoEm: evento.criadoEm,
    descricao: getEventoDescricao(evento),
    status: getEventoStatus(evento),
    manutencaoId: evento.manutencaoId,
  })
}

function buildHistoricoTimeline(alerta, eventos) {
  const eventosOrdenados = [...eventos].sort(compareTimelineDate)
  const items = eventosOrdenados
    .map(createTimelineItemFromEvento)
    .filter(Boolean)

  if (!items.some((item) => item.tipo === "alerta")) {
    items.unshift(createTimelineItem({
      tipo: "alerta",
      titulo: "Alerta aberto",
      usuario: { nome: "Sistema" },
      criadoEm: normalizeDateValue(alerta?.criadoEm),
      descricao: alerta?.mensagem,
      status: alerta?.status || "ATIVO",
    }))
  }

  return compactRepeatedTimelineItems(items.filter((item) => item.criadoEm || item.tipo === "alerta"))
}

export function HistoricoManutencaoPanel({
  alerta,
  eventos,
  status,
  mensagem,
  onRetry,
}) {
  const timeline = React.useMemo(
    () => buildHistoricoTimeline(alerta, eventos),
    [alerta, eventos]
  )
  const hasEventosManutencao = eventos.some(isEventoDeManutencao)
  const hasOnlyAlertaAberto = timeline.every((item) => item.tipo === "alerta")

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      <div className="rounded-lg border bg-muted/20 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{alerta?.maquinaNome || "Maquina nao informada"}</p>
            <p className="truncate text-xs text-muted-foreground">{alerta?.sensorNome || "Sensor nao informado"}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-muted-foreground">
            Somente leitura
          </Badge>
        </div>
      </div>

      {status === "loading" ? (
        <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Carregando historico de manutencao...
        </div>
      ) : status === "error" ? (
        <div className="grid gap-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-3 text-sm text-destructive">
          <span>{mensagem || "Nao foi possivel carregar o historico de manutencao."}</span>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
            <RefreshCcwIcon className="mr-1 size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="relative grid gap-4">
          {timeline.map((item, index) => {
            const Icon = getTimelineIcon(item.tipo)
            const tone = getManutencaoStatusTone(item.status)

            return (
              <div key={`${item.key}-${index}`} className="relative grid grid-cols-[28px_1fr] gap-3">
                {index < timeline.length - 1 ? (
                  <span className="absolute left-[13px] top-8 h-[calc(100%+0.5rem)] w-px bg-border" />
                ) : null}
                <span
                  className={`relative z-10 flex size-7 items-center justify-center rounded-full border bg-background ${
                    tone === "success"
                      ? "text-green-700 dark:text-green-300"
                      : tone === "warning"
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-[#3B2867] dark:text-white"
                  }`}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{item.titulo}</span>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ClockIcon className="size-3" />
                    {formatTimelineDateRange(item)}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.tipo === "alerta" || item.usuario === "Sistema" ? item.usuario : `Tecnico: ${item.usuario}`}</span>
                    {item.status ? (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                        {EVENTO_STATUS_LABEL[item.status] ?? item.status}
                      </Badge>
                    ) : null}
                  </div>
                  {item.descricao ? (
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{item.descricao}</p>
                  ) : null}
                </div>
              </div>
            )
          })}

          {!hasEventosManutencao && hasOnlyAlertaAberto ? (
            <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
              Nenhum evento de manutencao foi registrado para este alerta.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
