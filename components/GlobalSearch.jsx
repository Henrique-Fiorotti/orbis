"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  NfcIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
  WashingMachineIcon,
  XIcon,
} from "lucide-react"

import { useAdmins } from "@/components/context/admins-context"
import { useAlertas } from "@/components/context/alertas-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { useTecnicos } from "@/components/context/tecnicos-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const GROUP_LABELS = {
  maquina: "Máquinas",
  tecnico: "Técnicos",
  admin: "Administradores",
  sensor: "Sensores",
  alerta: "Alertas",
}

const GROUP_ICONS = {
  maquina: WashingMachineIcon,
  tecnico: UsersIcon,
  admin: ShieldCheckIcon,
  sensor: NfcIcon,
  alerta: AlertTriangleIcon,
}

const GROUP_SEARCH_TERMS = {
  maquina: ["maquina", "maquinas", "máquina", "máquinas"],
  tecnico: ["tecnico", "tecnicos", "técnico", "técnicos"],
  admin: ["admin", "admins", "administrador", "administradores"],
  sensor: ["sensor", "sensores"],
  alerta: ["alerta", "alertas", "chamado", "chamados"],
}

function normalizeSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const SECRET_GIF_URL =
  "https://i.redd.it/on-the-day-after-the-12th-anniversary-of-bti-i-cant-help-v0-eg9quxqqfm6g1.gif?width=480&auto=webp&s=9e4a1bb0dbe441f4c785afe108a9e00782975bee"

const SECRET_SEARCHES = [
  {
    terms: ["six seven", "67"],
    title: "six seven",
    src: SECRET_GIF_URL,
    className: "aspect-video object-cover",
  },
  {
    terms: ["fofinho"],
    title: "fofinho",
    src: "/fofinho.jpeg",
    className: "max-h-[80vh] object-contain",
  },
  {
    terms: ["guga", "guguinha gameplays"],
    title: "guga",
    src: "/guga.jpeg",
    className: "max-h-[80vh] object-contain",
  },
  {
    terms: ["ferrer", "carneirinho"],
    title: "ferrer",
    src: "/ferrer.jpeg",
    className: "max-h-[80vh] object-contain",
  },
  {
    terms: ["doom"],
    title: "doom",
    type: "game",
    src: "https://silentspacemarine.com/"
  },
]

function getSecretSearch(value) {
  const normalizedValue = normalizeSearch(value).trim().replace(/\s+/g, " ")

  return SECRET_SEARCHES.find((secret) => secret.terms.includes(normalizedValue))
}

function matchesSearch(item, query) {
  const normalizedQuery = normalizeSearch(query)

  if (!normalizedQuery) {
    return true
  }

  return item.searchText.includes(normalizedQuery)
}

function buildSearchText(values) {
  return normalizeSearch(values.filter(Boolean).join(" "))
}

function buildItemSearchText(type, values) {
  return buildSearchText([...(GROUP_SEARCH_TERMS[type] ?? []), ...values])
}

function getInitials(value) {
  return String(value ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function ResultIcon({ item }) {
  const { type, title, image } = item
  const Icon = GROUP_ICONS[type] ?? SearchIcon

  if (image) {
    return (
      <span className="flex size-9 shrink-0 overflow-hidden rounded-lg border bg-muted">
        <img src={image} alt="" className="size-full object-cover" />
      </span>
    )
  }

  if (type === "tecnico" || type === "admin") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-primary/20 dark:text-primary-foreground">
        {getInitials(title) || <Icon className="size-4" />}
      </span>
    )
  }

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-[#3B2867] dark:text-white">
      <Icon className="size-4" />
    </span>
  )
}

export function GlobalSearch({ open, onOpenChange }) {
  const router = useRouter()
  const inputRef = React.useRef(null)
  const resultsContentRef = React.useRef(null)
  const [query, setQuery] = React.useState("")
  const [secretOpen, setSecretOpen] = React.useState(false)
  const [activeSecret, setActiveSecret] = React.useState(null)
  const [secretGameSrc, setSecretGameSrc] = React.useState("")
  const [multiplayerLink, setMultiplayerLink] = React.useState("")
  const [resultsPanelHeight, setResultsPanelHeight] = React.useState(0)
  const [resultsPanelScrollable, setResultsPanelScrollable] = React.useState(false)
  const { admins, carregando: carregandoAdmins } = useAdmins()
  const { maquinas, carregando: carregandoMaquinas } = useMaquinas()
  const { sensores, carregando: carregandoSensores } = useSensores()
  const { tecnicos, carregando: carregandoTecnicos } = useTecnicos()
  const { alertas, carregando: carregandoAlertas = false } = useAlertas()

  const loading = carregandoMaquinas || carregandoSensores || carregandoTecnicos || carregandoAlertas || carregandoAdmins

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(timeoutId)
  }, [open])

  const items = React.useMemo(() => {
    if (!open) {
      return []
    }

    const machineItems = maquinas.map((maquina) => ({
      id: `maquina-${maquina.id}`,
      type: "maquina",
      title: maquina.nome,
      subtitle: [maquina.setor, maquina.tipo].filter(Boolean).join(" - "),
      meta: maquina.status,
      image: maquina.imagem,
      href: `/dashboard/maquinas?machineId=${encodeURIComponent(maquina.id)}`,
      searchText: buildItemSearchText("maquina", [
        maquina.nome,
        maquina.setor,
        maquina.tipo,
        maquina.status,
        maquina.criticidade,
      ]),
    }))

    const tecnicoItems = tecnicos.map((tecnico) => ({
      id: `tecnico-${tecnico.id}`,
      type: "tecnico",
      title: tecnico.nome,
      subtitle: tecnico.email,
      meta: tecnico.status,
      image: tecnico.foto,
      href: `/dashboard/tecnicos?tecnicoId=${encodeURIComponent(tecnico.id)}`,
      searchText: buildItemSearchText("tecnico", [
        tecnico.nome,
        tecnico.email,
        tecnico.telefone,
        tecnico.especialidade,
        tecnico.status,
      ]),
    }))

    const adminItems = admins.map((admin) => ({
      id: `admin-${admin.id}`,
      type: "admin",
      title: admin.nome,
      subtitle: admin.email,
      meta: admin.status,
      image: admin.foto,
      href: `/dashboard/admins?adminId=${encodeURIComponent(admin.id)}`,
      searchText: buildItemSearchText("admin", [
        admin.nome,
        admin.email,
        admin.telefone,
        admin.status,
      ]),
    }))

    const sensorItems = sensores.map((sensor) => ({
      id: `sensor-${sensor.id}`,
      type: "sensor",
      title: sensor.tipo || `Sensor #${sensor.id}`,
      subtitle: sensor.maquinaId ? sensor.maquinaNome : "Sem máquina vinculada",
      meta: sensor.status,
      href: `/dashboard/sensores?sensorId=${encodeURIComponent(sensor.id)}`,
      searchText: buildItemSearchText("sensor", [
        sensor.tipo,
        sensor.maquinaNome,
        sensor.status,
        sensor.id,
      ]),
    }))

    const alertaItems = alertas.map((alerta) => ({
      id: `alerta-${alerta.id}`,
      type: "alerta",
      title: alerta.maquinaNome || `Chamado #${alerta.id}`,
      subtitle: alerta.mensagem,
      meta: alerta.status,
      href: `/dashboard/alertas?alertaId=${encodeURIComponent(alerta.id)}`,
      searchText: buildItemSearchText("alerta", [
        alerta.maquinaNome,
        alerta.sensorNome,
        alerta.mensagem,
        alerta.tipo,
        alerta.status,
        alerta.severidade,
        alerta.tecnicoNome,
      ]),
    }))

    return [...machineItems, ...tecnicoItems, ...adminItems, ...sensorItems, ...alertaItems]
  }, [admins, alertas, maquinas, open, sensores, tecnicos])

  const results = React.useMemo(() => {
    if (!query.trim()) {
      return []
    }

    return items.filter((item) => matchesSearch(item, query))
  }, [items, query])

  const groupedResults = React.useMemo(
    () =>
      results.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = []
        }

        acc[item.type].push(item)
        return acc
      }, {}),
    [results]
  )

  React.useLayoutEffect(() => {
    if (!open || !resultsContentRef.current) {
      setResultsPanelHeight(0)
      setResultsPanelScrollable(false)
      return
    }

    function updateResultsPanelHeight() {
      const maxHeight = Math.max(160, Math.min(640, window.innerHeight - 128))
      const contentHeight = resultsContentRef.current?.scrollHeight ?? 0

      setResultsPanelHeight(Math.min(contentHeight, maxHeight))
      setResultsPanelScrollable(contentHeight > maxHeight)
    }

    updateResultsPanelHeight()

    const resizeObserver = new ResizeObserver(updateResultsPanelHeight)
    resizeObserver.observe(resultsContentRef.current)
    window.addEventListener("resize", updateResultsPanelHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateResultsPanelHeight)
    }
  }, [groupedResults, loading, open, query, results.length])

  function handleSelect(item) {
    onOpenChange(false)
    router.push(item.href)
  }

  function handleSearchKeyDown(event) {
    const secret = getSecretSearch(query)

    if (event.key !== "Enter" || !secret) {
      return
    }

    event.preventDefault()
    onOpenChange(false)
    setActiveSecret(secret)
    setSecretGameSrc(secret.src)
    setMultiplayerLink("")
    setSecretOpen(true)
  }

  function handleSecretOpenChange(nextOpen) {
    setSecretOpen(nextOpen)

    if (!nextOpen) {
      setSecretGameSrc(activeSecret?.src ?? "")
      setMultiplayerLink("")
    }
  }

  function handleMultiplayerSubmit(event) {
    event.preventDefault()

    const nextLink = multiplayerLink.trim()
    if (!nextLink) {
      return
    }

    setSecretGameSrc(nextLink)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="top-6 w-[min(900px,calc(100vw-2rem))]! max-h-[min(820px,calc(100vh-2rem))] max-w-none! translate-y-0 overflow-hidden rounded-[28px]! border bg-background/95 p-0 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-8 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-6 data-closed:zoom-out-95"
        >
          <DialogTitle className="sr-only ">Pesquisar</DialogTitle>
          <div className="flex items-center gap-3 px-5 py-1.5">
            <SearchIcon className="size-5 shrink-0 text-muted-foreground " />

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Pesquisar máquinas, técnicos, administradores, sensores e alertas..."
              className="h-12 flex-1 bg-transparent px-0 text-[17px] outline-none placeholder:text-muted-foreground"
            />

            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <XIcon className="size-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-[height,opacity,border-color] duration-300 ease-out",
              resultsPanelScrollable ? "overflow-y-auto" : "",
              query.trim() || loading ? "border-t opacity-100" : "opacity-95"
            )}
            style={{ height: resultsPanelHeight }}
          >
            <div ref={resultsContentRef} className="px-2 py-2">
              {loading ? (
                <div className="grid gap-2 p-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg px-3 py-2">
                      <span className="size-9 animate-pulse rounded-lg bg-muted" />
                      <span className="flex flex-1 flex-col gap-2">
                        <span className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                        <span className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : !query.trim() ? (
                <div className="flex min-h-28 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                  Digite para encontrar máquinas, técnicos, administradores, sensores ou alertas.
                </div>
              ) : results.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado.
                </div>
              ) : (
                Object.entries(groupedResults).map(([type, group]) => (
                  <div key={type} className="py-1">
                    <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      {GROUP_LABELS[type] ?? type}
                    </div>
                    <div className="grid gap-1">
                      {group.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className="flex w-full animate-in fade-in-0 slide-in-from-top-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-[background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                        >
                          <ResultIcon item={item} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                          </span>
                          {item.meta ? (
                            <span
                              className={cn(
                                "hidden shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex",
                                item.type === "alerta" && item.meta === "ATIVO"
                                  ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                                  : ""
                              )}
                            >
                              {item.meta}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={secretOpen} onOpenChange={handleSecretOpenChange}>
        <DialogContent
          className={cn(
            "max-w-none! overflow-hidden rounded-[12px]! p-0",
            activeSecret?.type === "game"
              ? "w-[min(800px,calc(100vw-2rem))]!"
              : "w-[min(480px,calc(100vw-2rem))]!"
          )}
        >
          <DialogTitle className="sr-only">{activeSecret?.title ?? "segredo"}</DialogTitle>
          {activeSecret ? (
            activeSecret.type === "game" ? (
              <>
                <iframe
                  src={secretGameSrc || activeSecret.src}
                  title={activeSecret.title}
                  className="block w-full bg-muted"
                  style={{ height: "700px", border: "none" }}
                  allowFullScreen
                />
                <form onSubmit={handleMultiplayerSubmit} className="flex items-end gap-2 border-t bg-background p-3">
                  <label className="min-w-0 flex-1">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Link multiplayer</span>
                    <input
                      value={multiplayerLink}
                      onChange={(event) => setMultiplayerLink(event.target.value)}
                      placeholder="Cole o link multiplayer do Doom..."
                      className="h-10 w-full rounded-[8px] border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                    />
                  </label>
                  <Button type="submit" className="h-10 cursor-pointer px-4">
                    Go
                  </Button>
                </form>
              </>
            ) : (
              <img
                src={activeSecret.src}
                alt={activeSecret.title}
                className={cn("block w-full bg-muted", activeSecret.className)}
              />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
