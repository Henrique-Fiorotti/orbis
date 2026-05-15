"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { useAlertas } from "@/components/context/alertas-context"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AUTH_SESSION_UPDATED_EVENT, getAuthSessionUser } from "@/lib/auth-session"
import { cn, tempoRelativo } from "@/lib/utils"
import {
  AlertTriangleIcon,
  BellIcon,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  MoonIcon,
  RouteIcon,
  SunIcon,
  XIcon,
} from "lucide-react"

const MAX_NOTIFICACOES = 12
const NOTIFICATION_STORAGE_VERSION = "v1"
const EMPTY_NOTIFICATION_PREFS = { lidas: [], removidas: [] }

const STATUS_NOTIFICACAO_LABEL = {
  ATIVO: "Chamado ativo",
  EM_ANDAMENTO: "Atendimento iniciado",
  RESOLVIDO: "Chamado resolvido",
  CANCELADO: "Chamado cancelado",
}

const BREADCRUMB_LABELS = {
  dashboard: "Dashboard",
  maquinas: "Máquinas",
  sensores: "Sensores",
  alertas: "Alertas",
  tecnicos: "Técnicos",
  admins: "Administradores",
  relatorios: "Relatórios",
  perfil: "Perfil",
}

function iconeNotificacao(tipo) {
  if (tipo === "alerta") return <AlertTriangleIcon className="size-3.5 text-red-500" />
  if (tipo === "sucesso") return <CircleCheckIcon className="size-3.5 text-green-500" />
  return <InfoIcon className="size-3.5 text-blue-500" />
}

function corFundo(tipo) {
  if (tipo === "alerta") return "border-red-100 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
  if (tipo === "sucesso") return "border-green-100 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10"
  return "border-blue-100 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10"
}

function getSaudacao() {
  const hora = new Date().getHours()
  if (hora >= 5 && hora < 12) return "Bom dia"
  if (hora >= 12 && hora < 18) return "Boa tarde"
  return "Boa noite"
}

function formatBreadcrumbLabel(segment) {
  return BREADCRUMB_LABELS[segment] || decodeURIComponent(segment).replaceAll("-", " ")
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function uniqueList(values) {
  return [...new Set(values.filter(Boolean).map(String))]
}

function normalizeNotificationPrefs(value) {
  if (!value || typeof value !== "object") {
    return EMPTY_NOTIFICATION_PREFS
  }

  return {
    lidas: uniqueList(Array.isArray(value.lidas) ? value.lidas : []),
    removidas: uniqueList(Array.isArray(value.removidas) ? value.removidas : []),
  }
}

function getNotificationStorageKey(usuario) {
  const userId = usuario?.id ?? usuario?.email ?? "anon"
  return `orbis-notificacoes:${NOTIFICATION_STORAGE_VERSION}:${userId}`
}

function readNotificationPrefs(storageKey) {
  if (!storageKey || !canUseBrowserStorage()) {
    return EMPTY_NOTIFICATION_PREFS
  }

  try {
    return normalizeNotificationPrefs(JSON.parse(window.localStorage.getItem(storageKey) || "{}"))
  } catch {
    return EMPTY_NOTIFICATION_PREFS
  }
}

function writeNotificationPrefs(storageKey, prefs) {
  if (!storageKey || !canUseBrowserStorage()) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(normalizeNotificationPrefs(prefs)))
}

function getNotificationDate(alerta) {
  return alerta?.ultimaOcorrenciaEm || alerta?.atualizadoEm || alerta?.criadoEm || new Date().toISOString()
}

function getNotificationType(alerta) {
  if (alerta.status === "RESOLVIDO") return "sucesso"
  if (alerta.status === "ATIVO" || alerta.severidade === "ALTA") return "alerta"
  return "info"
}

function getNotificationTitle(alerta) {
  if (alerta.status === "RESOLVIDO") {
    return `${STATUS_NOTIFICACAO_LABEL.RESOLVIDO} #${alerta.id}`
  }

  if (alerta.status === "EM_ANDAMENTO") {
    return `${STATUS_NOTIFICACAO_LABEL.EM_ANDAMENTO} #${alerta.id}`
  }

  if (alerta.severidade === "ALTA") {
    return `Chamado crítico #${alerta.id}`
  }

  return `${STATUS_NOTIFICACAO_LABEL[alerta.status] ?? "Chamado"} #${alerta.id}`
}

function buildAlertNotification(alerta, prefs) {
  const data = getNotificationDate(alerta)
  const key = `alerta:${alerta.id}:${alerta.status}:${data}`
  const removidas = new Set(prefs.removidas)

  if (removidas.has(key)) {
    return null
  }

  const lidas = new Set(prefs.lidas)
  const lidaPorPadrao = alerta.status !== "ATIVO" && alerta.status !== "EM_ANDAMENTO"
  const ocorrencias = Number(alerta.ocorrencias)
  const ocorrenciasDescricao = Number.isFinite(ocorrencias) && ocorrencias > 1 ? ` (${ocorrencias} ocorrências)` : ""
  const maquina = alerta.maquinaNome || "Máquina não informada"
  const sensor = alerta.sensorNome || "Sensor Não informado"

  return {
    key,
    tipo: getNotificationType(alerta),
    titulo: getNotificationTitle(alerta),
    descricao: `${maquina} - ${sensor}: ${alerta.mensagem}${ocorrenciasDescricao}`,
    tempo: tempoRelativo(data),
    timestamp: Date.parse(data) || 0,
    lida: lidas.has(key) || lidaPorPadrao,
    href: `/dashboard/alertas?alertaId=${encodeURIComponent(alerta.id)}`,
  }
}

function buildNotifications(alertas, prefs) {
  return alertas
    .map((alerta) => buildAlertNotification(alerta, prefs))
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_NOTIFICACOES)
}

export function SiteHeader({ tourId }) {
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { alertas, status: alertasStatus } = useAlertas()
  const [painelAberto, setPainelAberto] = React.useState(false)
  const [notificationPrefs, setNotificationPrefs] = React.useState(EMPTY_NOTIFICATION_PREFS)
  const [notificationStorageKey, setNotificationStorageKey] = React.useState("")
  const [mounted, setMounted] = React.useState(false)
  const [nomeUsuario, setNomeUsuario] = React.useState("usuário")
  const panelRef = React.useRef(null)
  const syncedInitialNotificationsRef = React.useRef(false)
  const notificationKeysRef = React.useRef(new Set())

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    function syncUserName() {
      const usuario = getAuthSessionUser()

      setNomeUsuario(usuario?.nome || "usuário")
      setNotificationStorageKey(getNotificationStorageKey(usuario))
    }

    syncUserName()

    window.addEventListener("storage", syncUserName)
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncUserName)

    return () => {
      window.removeEventListener("storage", syncUserName)
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncUserName)
    }
  }, [])

  React.useEffect(() => {
    setNotificationPrefs(readNotificationPrefs(notificationStorageKey))
    syncedInitialNotificationsRef.current = false
    notificationKeysRef.current = new Set()
  }, [notificationStorageKey])

  const notificacoes = React.useMemo(
    () => buildNotifications(alertas, notificationPrefs),
    [alertas, notificationPrefs]
  )
  const isDark = resolvedTheme === "dark"
  const naoLidas = notificacoes.filter((notificacao) => !notificacao.lida).length
  const sincronizandoNotificacoes = alertasStatus === "loading" && notificacoes.length === 0
  const breadcrumbItems = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)

    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`

      return {
        href,
        label: formatBreadcrumbLabel(segment),
      }
    })
  }, [pathname])

  React.useEffect(() => {
    document.title = `${naoLidas > 0 ? `(${naoLidas}) ` : ""}Orbis`
  }, [naoLidas])

  React.useEffect(() => {
    function handleClickFora(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPainelAberto(false)
      }
    }

    if (painelAberto) document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [painelAberto])

  React.useEffect(() => {
    if (alertasStatus === "loading") {
      return
    }

    const keysAtuais = new Set(notificacoes.map((notificacao) => notificacao.key))

    if (!syncedInitialNotificationsRef.current) {
      syncedInitialNotificationsRef.current = true
      notificationKeysRef.current = keysAtuais
      return
    }

    const novas = notificacoes.filter(
      (notificacao) => !notificacao.lida && !notificationKeysRef.current.has(notificacao.key)
    )

    notificationKeysRef.current = keysAtuais

    if (novas.length === 0) {
      return
    }

    const primeira = novas[0]
    toast.warning(novas.length > 1 ? `${novas.length} novos alertas` : primeira.titulo, {
      description: primeira.descricao,
      action: {
        label: "Ver",
        onClick: () => {
          marcarLida(primeira.key)
          router.push(primeira.href)
        },
      },
    })
  }, [alertasStatus, notificacoes, router])

  function updateNotificationPrefs(updater) {
    setNotificationPrefs((current) => {
      const next = normalizeNotificationPrefs(updater(current))
      const pruned = {
        lidas: next.lidas.slice(-80),
        removidas: next.removidas.slice(-80),
      }

      writeNotificationPrefs(notificationStorageKey, pruned)
      return pruned
    })
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark")
  }

  function marcarTodasLidas() {
    updateNotificationPrefs((current) => ({
      ...current,
      lidas: uniqueList([...current.lidas, ...notificacoes.map((notificacao) => notificacao.key)]),
    }))
  }

  function marcarLida(key) {
    updateNotificationPrefs((current) => ({
      ...current,
      lidas: uniqueList([...current.lidas, key]),
    }))
  }

  function removerNotificacao(key) {
    updateNotificationPrefs((current) => ({
      ...current,
      removidas: uniqueList([...current.removidas, key]),
    }))
  }

  function limparNotificacoes() {
    updateNotificationPrefs((current) => ({
      ...current,
      removidas: uniqueList([
        ...current.removidas,
        ...notificacoes.map((notificacao) => notificacao.key),
      ]),
    }))
  }

  return (
    <header
      id={tourId}
      className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear supports-[backdrop-filter]:bg-background/80 md:h-[90px]"
    >
      <div className="flex min-w-0 w-full items-center gap-1 px-3 sm:px-4 lg:gap-2 lg:px-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger id="tour-sidebar-trigger" className="cursor-pointer shrink-0 dark:text-white dark:hover:bg-gray-200/10!" />
          </TooltipTrigger>
          <TooltipContent>
            <span>Expandir/contrair menu</span>
          </TooltipContent>
        </Tooltip>

        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-auto"
        />

        <div className="min-w-0">
          <Breadcrumb>
            <BreadcrumbList className="gap-1 text-[10pt] text-gray-500 dark:text-gray-300">
              {breadcrumbItems.map((item, index) => {
                const isCurrent = index === breadcrumbItems.length - 1

                return (
                  <React.Fragment key={item.href}>
                    <BreadcrumbItem className="min-w-0">
                      {isCurrent ? (
                        <BreadcrumbPage className="truncate text-gray-500 dark:text-gray-300">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="truncate no-underline hover:underline hover:text-[#5E17EB]">
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isCurrent && (
                      <BreadcrumbSeparator className="text-gray-400 dark:text-gray-500">
                        <span>{">"}</span>
                      </BreadcrumbSeparator>
                    )}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <h2 className="truncate text-sm text-muted-foreground font-normal m-0! dark:text-white!">
            {getSaudacao()}, {nomeUsuario}!
          </h2>
        </div>

        <div className="flex-1" />

        <div className="flex shrink-0 items-center gap-1">
          {pathname === "/dashboard" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    window.dispatchEvent(new CustomEvent("orbit:start-tour"))
                  }}
                  className="cursor-pointer h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Tour guiado"
                >
                  <RouteIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Tour guiado</span>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                className="cursor-pointer h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isDark ? "Modo claro" : "Modo escuro"}
              >
                {mounted ? (
                  isDark ? (
                    <SunIcon className="size-4 text-white" />
                  ) : (
                    <MoonIcon className="size-4" />
                  )
                ) : (
                  <MoonIcon className="size-4 opacity-0" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDark ? <span>Modo claro</span> : <span>Modo escuro</span>}
            </TooltipContent>
          </Tooltip>

          <div className="relative" ref={panelRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPainelAberto((prev) => !prev)}
                  className="cursor-pointer h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground transition-colors relative"
                  aria-label="Notificações"
                  aria-expanded={painelAberto}
                >
                  <BellIcon className="size-4" />
                  {naoLidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7700C4] text-[10px] font-semibold text-white px-0.5 leading-none">
                      {naoLidas > 9 ? "9+" : naoLidas}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Notificações</span>
              </TooltipContent>
            </Tooltip>

            {painelAberto && (
              <div className="absolute right-0 top-10 z-50 w-[calc(100vw-2rem)] max-w-[360px] rounded-xl border bg-popover shadow-xl ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Notificações
                    </span>
                    {sincronizandoNotificacoes ? (
                      <Badge
                        variant="outline"
                        className="h-5 gap-1 px-1.5 text-xs text-muted-foreground"
                      >
                        <Loader2Icon className="size-3 animate-spin" />
                        Atualizando
                      </Badge>
                    ) : naoLidas > 0 ? (
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
                      >
                        {naoLidas} nova{naoLidas > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                  </div>
                  {naoLidas > 0 && (
                    <button
                      type="button"
                      onClick={marcarTodasLidas}
                      className="text-xs text-primary hover:underline font-medium transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto">
                  {sincronizandoNotificacoes ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                      <Loader2Icon className="size-8 animate-spin opacity-40" />
                      <p className="text-sm">Sincronizando alertas...</p>
                    </div>
                  ) : notificacoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                      <BellIcon className="size-8 opacity-30" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notificacoes.map((n) => (
                      <div
                        key={n.key}
                        className={cn(
                          "group relative flex gap-3 border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/50",
                          n.lida ? "bg-background" : "bg-muted/30"
                        )}
                      >
                        <div
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${corFundo(n.tipo)}`}
                        >
                          {iconeNotificacao(n.tipo)}
                        </div>

                        <Link
                          href={n.href}
                          className="min-w-0 flex-1 no-underline"
                          onClick={() => {
                            marcarLida(n.key)
                            setPainelAberto(false)
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-xs font-semibold leading-snug ${n.lida ? "text-muted-foreground" : "text-foreground"}`}
                            >
                              {n.titulo}
                            </p>
                            {!n.lida && (
                              <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {n.descricao}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {n.tempo}
                          </p>
                        </Link>

                        <button
                          type="button"
                          onClick={() => removerNotificacao(n.key)}
                          aria-label="Remover notificação"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {notificacoes.length > 0 && (
                  <div className="px-4 py-2.5 border-t bg-muted/20">
                    <button
                      type="button"
                      onClick={limparNotificacoes}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                    >
                      Limpar todas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
