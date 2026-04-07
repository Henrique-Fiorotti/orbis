"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  SunIcon,
  MoonIcon,
  BellIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
  CircleCheckIcon,
} from "lucide-react"

// ── Mock de notificações ──────────────────────────────────────────
const MOCK_NOTIFICACOES = [
  {
    id: 1,
    tipo: "alerta",
    titulo: "Vibração elevada detectada",
    descricao: "Motor Esteira A1 ultrapassou o limite de 0.80 mm/s.",
    tempo: "2min atrás",
    lida: false,
  },
  {
    id: 2,
    tipo: "alerta",
    titulo: "Sensor offline",
    descricao: "Bomba Hidráulica D1 perdeu conexão com o sensor.",
    tempo: "12min atrás",
    lida: false,
  },
  {
    id: 3,
    tipo: "info",
    titulo: "Técnico atribuído",
    descricao: "Carlos Eduardo foi atribuído ao alerta #2.",
    tempo: "45min atrás",
    lida: false,
  },
  {
    id: 4,
    tipo: "sucesso",
    titulo: "Alerta resolvido",
    descricao: "Prensa G4 — instabilidade normalizada com sucesso.",
    tempo: "2h atrás",
    lida: true,
  },
  {
    id: 5,
    tipo: "info",
    titulo: "Novo equipamento Orbis",
    descricao: "Orbis G4 foi cadastrado na plataforma.",
    tempo: "5h atrás",
    lida: true,
  },
]

function iconeNotificacao(tipo) {
  if (tipo === "alerta") return <AlertTriangleIcon className="size-3.5 text-red-500" />
  if (tipo === "sucesso") return <CircleCheckIcon className="size-3.5 text-green-500" />
  return <InfoIcon className="size-3.5 text-blue-500" />
}

function corFundo(tipo) {
  if (tipo === "alerta") return "bg-red-50 border-red-100"
  if (tipo === "sucesso") return "bg-green-50 border-green-100"
  return "bg-blue-50 border-blue-100"
}

// ── Tema ──────────────────────────────────────────────────────────
function useTheme() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Lê preferência salva ou usa preferência do sistema
    const salvo = localStorage.getItem("orbis-theme")
    const prefereDark = salvo
      ? salvo === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDark(prefereDark)
    document.documentElement.classList.toggle("dark", prefereDark)
  }, [])

  function toggle() {
    const novoTema = !isDark
    setIsDark(novoTema)
    document.documentElement.classList.toggle("dark", novoTema)
    localStorage.setItem("orbis-theme", novoTema ? "dark" : "light")
  }

  return { isDark, toggle }
}

// ── Componente principal ──────────────────────────────────────────
export function SiteHeader() {
  const { isDark, toggle } = useTheme()
  const [painelAberto, setPainelAberto] = React.useState(false)
  const [notificacoes, setNotificacoes] = React.useState(MOCK_NOTIFICACOES)
  const panelRef = React.useRef(null)

  const naoLidas = notificacoes.filter(n => !n.lida).length

  // Fecha painel ao clicar fora
  React.useEffect(() => {
    function handleClickFora(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPainelAberto(false)
      }
    }
    if (painelAberto) document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [painelAberto])

  function marcarTodasLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
  }

  function marcarLida(id) {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  function removerNotificacao(id) {
    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <header className="flex h-[90px] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">

        {/* Esquerda */}
        <Tooltip>
          <TooltipTrigger><SidebarTrigger /></TooltipTrigger>
          <TooltipContent>
            <span>Expandir/Contrair Sidebar</span>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-auto" />
        <div className="">
          <h1 className="text-gray-500! text-base text-[13pt]! font-medium m-0!">Dashboard Orbis</h1>
          <h2 className="text-sm text-muted-foreground font-normal m-0!">Bom dia, Administrador!</h2>
        </div>

        {/* Espaçador */}
        <div className="flex-1" />

        {/* Ações — direita */}
        <div className="flex items-center gap-1">

          {/* Toggle de tema */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggle}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                {isDark
                  ? <SunIcon className="size-4 text-yellow-400" />
                  : <MoonIcon className="size-4" />
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDark
                ? <span>Light mode</span>
                : <span>Dark mode</span>
              }
            </TooltipContent>
          </Tooltip>


          {/* Sino de notificações */}
          <div className="relative" ref={panelRef}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPainelAberto(prev => !prev)}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors relative"
                >
                  <BellIcon className="size-4" />
                  {naoLidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white px-0.5 leading-none">
                      {naoLidas > 9 ? "9+" : naoLidas}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Notificações</span>
              </TooltipContent>
            </Tooltip>


            {/* Painel de notificações */}
            {painelAberto && (
              <div className="absolute right-0 top-10 z-50 w-[360px] rounded-xl border bg-popover shadow-xl ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">

                {/* Header do painel */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Notificações</span>
                    {naoLidas > 0 && (
                      <Badge variant="outline" className="h-5 px-1.5 text-xs bg-red-50 text-red-700 border-red-200">
                        {naoLidas} nova{naoLidas > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {naoLidas > 0 && (
                    <button
                      onClick={marcarTodasLidas}
                      className="text-xs text-primary hover:underline font-medium transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                {/* Lista */}
                <div className="max-h-[380px] overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                      <BellIcon className="size-8 opacity-30" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notificacoes.map((n) => (
                      <div
                        key={n.id}
                        className={`group relative flex gap-3 px-4 py-3 border-b last:border-0 transition-colors ${n.lida ? "bg-background" : "bg-muted/30"
                          } hover:bg-muted/50`}
                      >
                        {/* Ícone do tipo */}
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${corFundo(n.tipo)}`}>
                          {iconeNotificacao(n.tipo)}
                        </div>

                        {/* Conteúdo */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => marcarLida(n.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-semibold leading-snug ${n.lida ? "text-muted-foreground" : "text-foreground"}`}>
                              {n.titulo}
                            </p>
                            {!n.lida && (
                              <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                            {n.descricao}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">{n.tempo}</p>
                        </div>

                        {/* Botão remover */}
                        <button
                          onClick={() => removerNotificacao(n.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notificacoes.length > 0 && (
                  <div className="px-4 py-2.5 border-t bg-muted/20">
                    <button
                      onClick={() => setNotificacoes([])}
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