"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useAlertas } from "@/components/context/alertas-context"
import { useTecnicos } from "@/components/context/tecnicos-context"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MetricValue, useDashboardMetricsLoading } from "@/components/animated-metric"
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { SiteHeader } from "@/components/site-header"
import { TablePagination } from "@/components/table-pagination"
import {
  UsersIcon, EllipsisVerticalIcon, PlusIcon,
  ArrowLeftIcon, PencilIcon, Trash2Icon, EyeIcon, SearchIcon,
  CircleCheckIcon, CircleMinusIcon, ImageIcon, RefreshCcwIcon,
} from "lucide-react"
import {
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table"
import { runAfterCurrentOverlayCloses } from "@/lib/deferred-ui"
import { tempoRelativo } from "@/lib/utils"
import { getWhatsappUrl } from "@/lib/whatsapp-url.mjs"
import {
  formatBrazilianPhoneInput,
  isValidBackendPassword,
  isValidBrazilianPhone,
  isValidEmail,
} from "@/lib/form-formatters"

const ESPECIALIDADES = [
  "Elétrica Industrial",
  "Mecânica de Precisão",
  "Hidráulica e Pneumática",
  "Automação Industrial",
  "Instrumentação",
  "Manutenção Preditiva",
]

const formVazio = {
  nome: "", email: "", senha: "", telefone: "",
  especialidade: "Elétrica Industrial", status: "ATIVO", foto: "",
}

function getInitials(nome) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("")
}

function TecnicoAvatar({ tecnico, size = "default", onClick }) {
  const sizeClass = size === "lg"
    ? "h-16 w-16 text-xl"
    : size === "sm"
      ? "h-18 w-18 text-xs"
      : "h-8 w-8 text-xs"
  const avatar = (
    <Avatar className={sizeClass}>
      <AvatarImage src={tecnico.foto || undefined} alt={tecnico.nome} />
      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold dark:bg-primary/20 dark:text-primary-foreground">
        {getInitials(tecnico.nome)}
      </AvatarFallback>
    </Avatar>
  )

  if (tecnico.foto && typeof onClick === "function") {
    return (
      <button
        type="button"
        aria-label={`Ver foto de ${tecnico.nome} em tela cheia`}
        className="cursor-pointer rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB] focus-visible:ring-offset-2"
        onClick={onClick}
      >
        {avatar}
      </button>
    )
  }

  return avatar
}

function StatusTecnicoBadge({ value }) {
  const isAtivo = value === "ATIVO"
  return (
    <Badge variant="outline" className={`px-1.5 ${isAtivo ? "text-green-700 bg-green-50 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : "text-gray-500 bg-gray-50 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground"}`}>
      {isAtivo ? <CircleCheckIcon className="fill-green-600!" /> : <CircleMinusIcon className="text-gray-400 dark:text-muted-foreground" />}
      {isAtivo ? "Ativo" : "Inativo"}
    </Badge>
  )
}

function PerfilTecnicoBadge() {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      Técnico
    </Badge>
  )
}

function EspecialidadeBadge({ value }) {
  const especialidade = String(value ?? "").trim()

  if (!especialidade) {
    return null
  }

  return (
    <Badge variant="outline" className="max-w-full px-1.5 text-muted-foreground">
      <span className="truncate">{especialidade}</span>
    </Badge>
  )
}

function TecnicoMobileCard({ tecnico, onOpen }) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-4 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:border-[#5E17EB] focus-visible:border-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/20 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(tecnico)}
    >
      <span className="shrink-0">
        <TecnicoAvatar tecnico={tecnico} size="sm" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="min-w-0">
          <span className="line-clamp-1 text-xl font-medium leading-tight text-foreground">{tecnico.nome}</span>
          <span className="block truncate text-base text-muted-foreground">{tecnico.email}</span>
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <PerfilTecnicoBadge />
          <EspecialidadeBadge value={tecnico.especialidade} />
          <StatusTecnicoBadge value={tecnico.status} />
        </span>
      </span>
    </button>
  )
}

function StatePanel({ message, tone = "muted" }) {
  return (
    <div
      className={`flex min-h-[280px] items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm ${
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-muted/20 text-muted-foreground"
      }`}
    >
      {message}
    </div>
  )
}

function TecnicoMetricCard({ label, value, badge, badgeClass = "", footer, icon: Icon, selected = false, featured = false, onClick }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClick?.()
    }
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`@container/card cursor-pointer transition-colors hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50 focus-visible:border-[#5E17EB]! focus-visible:ring-2 focus-visible:ring-[#5E17EB]/30 focus-visible:outline-none ${
        selected ? "border-[#5E17EB]! ring-2 ring-[#5E17EB]/30" : ""
      }`}
    >
      <CardHeader className="min-h-[76px]">
        <CardDescription className={featured ? "" : "text-black! dark:text-white!"}>{label}</CardDescription>
        <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${featured ? "text-[#5E17EB]!" : ""}`}>
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={badgeClass}>
            <Icon className="size-3.5" />
            {badge}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex items-center gap-2 font-medium">
          {footer}
          <Icon className="size-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

function formatMetric(value, loading, suffix = "") {
  if (loading) {
    return "--"
  }

  return `${value}${suffix}`
}

function normalizarBusca(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function buildResolvedAlertsCountByTecnico(alertas) {
  const byId = new Map()
  const byName = new Map()

  for (const alerta of alertas) {
    if (alerta.status !== "RESOLVIDO") {
      continue
    }

    if (alerta.tecnicoId !== null && alerta.tecnicoId !== undefined) {
      const key = String(alerta.tecnicoId)
      byId.set(key, (byId.get(key) ?? 0) + 1)
      continue
    }

    const nomeKey = normalizarBusca(alerta.tecnicoNome)

    if (nomeKey) {
      byName.set(nomeKey, (byName.get(nomeKey) ?? 0) + 1)
    }
  }

  return { byId, byName }
}

function getResolvedAlertsCountForTecnico(tecnico, counts) {
  const idCount = counts.byId.get(String(tecnico.id))

  if (idCount !== undefined) {
    return idCount
  }

  return counts.byName.get(normalizarBusca(tecnico.nome)) ?? 0
}

function formatarTelefoneExibicao(value) {
  return String(value ?? "").trim() || "Não informado"
}

function formatarCadastroTecnico(value) {
  const cadastro = tempoRelativo(value)
  return cadastro === "Sem leitura" ? "Não informado" : cadastro
}

export default function TecnicosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const permissions = useDashboardPermissions()
  const {
    tecnicos,
    status,
    mensagem,
    carregando,
    salvando,
    adicionarTecnico,
    editarTecnico,
    excluirTecnico,
    recarregarTecnicos,
  } = useTecnicos()
  const { alertas } = useAlertas()

  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [tecnicoSelecionado, setTecnicoSelecionado] = React.useState(null)
  const [fotoFullscreen, setFotoFullscreen] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [tecnicoExcluir, setTecnicoExcluir] = React.useState(null)
  const [limiteItems] = React.useState(10)
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [filtroResumo, setFiltroResumo] = React.useState("TODOS")
  const tecnicoAbertoPelaUrlRef = React.useRef(null)

  React.useEffect(() => {
    if (!permissions.canViewTecnicos) {
      router.replace("/dashboard")
    }
  }, [permissions.canViewTecnicos, router])

  const loadingInicial = useDashboardMetricsLoading(carregando && tecnicos.length === 0)
  const errorSemDados = status === "error" && tecnicos.length === 0
  const canManageTecnicos = permissions.canManageTecnicos
  const tecnicoWhatsappUrl = getWhatsappUrl(tecnicoSelecionado?.telefone)

  function abrirFotoFullscreen(tecnico) {
    if (!tecnico?.foto) return

    setFotoFullscreen({
      src: tecnico.foto,
      alt: tecnico.nome ? `Foto de ${tecnico.nome}` : "Foto do técnico",
    })
  }

  const resolvedAlertsByTecnico = React.useMemo(() => buildResolvedAlertsCountByTecnico(alertas), [alertas])
  const tecnicosComAlertasAtendidos = React.useMemo(
    () =>
      tecnicos.map((tecnico) => ({
        ...tecnico,
        alertasAtendidos: getResolvedAlertsCountForTecnico(tecnico, resolvedAlertsByTecnico),
      })),
    [resolvedAlertsByTecnico, tecnicos]
  )
  const totalAtivos = React.useMemo(() => tecnicosComAlertasAtendidos.filter((tecnico) => tecnico.status === "ATIVO").length, [tecnicosComAlertasAtendidos])
  const totalInativos = React.useMemo(() => tecnicosComAlertasAtendidos.filter((tecnico) => tecnico.status === "INATIVO").length, [tecnicosComAlertasAtendidos])
  const tecnicosComAtendimentosResolvidos = React.useMemo(
    () => tecnicosComAlertasAtendidos.filter((tecnico) => tecnico.alertasAtendidos > 0).length,
    [tecnicosComAlertasAtendidos]
  )
  const totalAlertasAtendidos = React.useMemo(
    () => tecnicosComAlertasAtendidos.reduce((total, tecnico) => total + tecnico.alertasAtendidos, 0),
    [tecnicosComAlertasAtendidos]
  )
  React.useEffect(() => {
    setTecnicoSelecionado((current) => {
      if (!current) {
        return current
      }

      return tecnicosComAlertasAtendidos.find((tecnico) => String(tecnico.id) === String(current.id)) ?? current
    })
  }, [tecnicosComAlertasAtendidos])
  const tecnicosFiltrados = React.useMemo(() => {
    const termo = normalizarBusca(busca)

    return tecnicosComAlertasAtendidos.filter((tecnico) => {
      const correspondeResumo =
        filtroResumo === "TODOS" ||
        tecnico.status === filtroResumo ||
        (filtroResumo === "COM_ALERTAS" && tecnico.alertasAtendidos > 0)

      if (!correspondeResumo) {
        return false
      }

      if (!termo) {
        return true
      }

      return [
        tecnico.nome,
        tecnico.especialidade,
        tecnico.email,
        tecnico.telefone,
        tecnico.status,
      ].some((value) => normalizarBusca(value).includes(termo))
    })
  }, [busca, filtroResumo, tecnicosComAlertasAtendidos])
  const filtroResumoLabel = React.useMemo(() => {
    if (filtroResumo === "ATIVO") return "Ativos"
    if (filtroResumo === "INATIVO") return "Inativos"
    if (filtroResumo === "COM_ALERTAS") return "Com alertas resolvidos"
    return "todos"
  }, [filtroResumo])

  React.useEffect(() => {
    if (!permissions.canViewTecnicos) {
      return
    }

    if (searchParams.get("action") === "new") {
      if (!canManageTecnicos) {
        router.replace("/dashboard/tecnicos")
        return
      }

      abrirCriar()
    }
  }, [canManageTecnicos, permissions.canViewTecnicos, router, searchParams])

  React.useEffect(() => {
    if (!permissions.canViewTecnicos) {
      return
    }

    const tecnicoIdParam = searchParams.get("tecnicoId")

    if (!tecnicoIdParam || tecnicosComAlertasAtendidos.length === 0) {
      if (!tecnicoIdParam) {
        tecnicoAbertoPelaUrlRef.current = null
      }
      return
    }

    const tecnicoIdKey = String(tecnicoIdParam)

    if (tecnicoAbertoPelaUrlRef.current === tecnicoIdKey) {
      return
    }

    const tecnico = tecnicosComAlertasAtendidos.find((item) => String(item.id) === String(tecnicoIdParam))

    if (tecnico) {
      tecnicoAbertoPelaUrlRef.current = tecnicoIdKey
      abrirVer(tecnico)
    }
  }, [permissions.canViewTecnicos, searchParams, tecnicosComAlertasAtendidos])

  React.useEffect(() => {
    if (!permissions.canViewTecnicos) {
      return
    }

    recarregarTecnicos(1, limiteItems)
  }, [limiteItems, permissions.canViewTecnicos, recarregarTecnicos])

  function abrirCriar() {
    if (!canManageTecnicos) {
      return
    }

    setModoSheet("criar")
    setForm(formVazio)
    setTecnicoSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(tecnico) {
    if (!canManageTecnicos) {
      return
    }

    setModoSheet("editar")
    setForm({
      nome: tecnico.nome, email: tecnico.email,
      senha: "",
      telefone: tecnico.telefone, especialidade: tecnico.especialidade,
      status: tecnico.status, foto: tecnico.foto || "",
    })
    setTecnicoSelecionado(tecnico)
    setSheetAberto(true)
  }

  function abrirVer(tecnico) {
    setModoSheet("ver")
    setTecnicoSelecionado(tecnico)
    setSheetAberto(true)
  }

  async function salvar() {
    const nome = form.nome.trim()
    const email = form.email.trim()
    const telefone = form.telefone.trim()

    if (nome.length < 3) {
      toast.error("Informe o nome completo com pelo menos 3 caracteres.")
      return
    }

    if (!isValidEmail(email)) {
      toast.error("Informe um e-mail válido para o técnico.")
      return
    }

    if (modoSheet === "criar" && !isValidBackendPassword(form.senha)) {
      toast.error("A senha precisa ter 7+ caracteres, letra maiúscula, minúscula e número.")
      return
    }

    if (modoSheet === "editar" && telefone && !isValidBrazilianPhone(telefone)) {
      toast.error("Informe o telefone no formato (11) 99999-9999.")
      return
    }

    try {
      if (modoSheet === "criar") {
        await adicionarTecnico({
          nome,
          email,
          senha: form.senha.trim(),
          role: "TECNICO",
        })
        toast.success("Técnico cadastrado com sucesso!")
      } else {
        await editarTecnico(tecnicoSelecionado.id, {
          nome,
          ...(telefone ? { telefone } : {}),
          especialidade: form.especialidade,
          ativo: form.status === "ATIVO",
        })
        toast.success("Técnico atualizado com sucesso!")
      }

      setSheetAberto(false)
      setForm(formVazio)
      setTecnicoSelecionado(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o técnico.")
    }
  }

  function confirmarExcluir(tecnico) {
    if (!canManageTecnicos) {
      return
    }

    setTecnicoExcluir(tecnico)
    setDialogExcluir(true)
  }

  function alternarDialogExcluir(open) {
    setDialogExcluir(open)

    if (!open) {
      setTecnicoExcluir(null)
    }
  }

  async function excluir() {
    if (!tecnicoExcluir) {
      return
    }

    try {
      await excluirTecnico(tecnicoExcluir.id)
      toast.success("Técnico removido.")
      setDialogExcluir(false)
      setSheetAberto(false)
      setTecnicoExcluir(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o técnico.")
    }
  }

  const columns = [
    {
      accessorKey: "nome",
      header: "Técnico",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <TecnicoAvatar tecnico={row.original} size="sm" />
          <button
            onClick={() => abrirVer(row.original)}
            className="cursor-pointer text-left font-medium text-sm hover:underline hover:text-primary transition-colors"
          >
            {row.original.nome}
          </button>
        </div>
      ),
    },
    {
      accessorKey: "especialidade",
      header: "Especialidade",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.especialidade}</span>,
    },
    {
      accessorKey: "email",
      header: "E-mail",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: "telefone",
      header: "Telefone",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatarTelefoneExibicao(row.original.telefone)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusTecnicoBadge value={row.original.status} />,
    },
    {
      accessorKey: "alertasAtendidos",
      header: "Alertas atendidos",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-sm text-[#3B2867] dark:text-white">{row.original.alertasAtendidos}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => abrirVer(row.original))}><EyeIcon className="size-4 mr-1" /> Ver detalhes</DropdownMenuItem>
            {canManageTecnicos ? (
              <>
                <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => abrirEditar(row.original))}><PencilIcon className="size-4 mr-1" /> Editar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" variant="destructive" onSelect={() => runAfterCurrentOverlayCloses(() => confirmarExcluir(row.original))}><Trash2Icon className="size-4 mr-1" /> Excluir</DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: tecnicosFiltrados, columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!permissions.canViewTecnicos) {
    return null
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className={"cursor-pointer"} size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <UsersIcon size={22} className="text-[#3B2867] dark:text-white" />
                <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Técnicos</h1>
              </div>
            
            </div>
          </div>
          {canManageTecnicos ? (
            <Button onClick={abrirCriar} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
              <PlusIcon className="size-4 mr-1" />Novo técnico
            </Button>
          ) : null}
        </div>

        <Separator />

        {mensagem ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === "error"
                ? "border-destructive/25 bg-destructive/5 text-destructive"
                : "border-border/60 bg-muted/30 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{mensagem}</span>
              <RefreshTooltipButton
                onClick={() => recarregarTecnicos()}
                disabled={carregando || salvando}
                successMessage="Atualização dos técnicos concluída."
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
          <TecnicoMetricCard
            featured
            icon={UsersIcon}
            label="Total de técnicos"
            value={<MetricValue value={tecnicos.length} loading={loadingInicial} />}
            badge={loadingInicial ? "Sincronizando" : `${totalAtivos} ativos`}
            footer={loadingInicial ? "Atualizando equipe..." : `${totalAtivos} operando normalmente`}
            selected={filtroResumo === "TODOS"}
            onClick={() => setFiltroResumo("TODOS")}
          />

          <TecnicoMetricCard
            icon={CircleCheckIcon}
            label="Técnicos ativos"
            value={<MetricValue value={totalAtivos} loading={loadingInicial} />}
            badge="Operando"
            badgeClass={totalAtivos > 0 ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : ""}
            footer={loadingInicial ? "Atualizando equipe..." : `${totalAtivos} disponíveis`}
            selected={filtroResumo === "ATIVO"}
            onClick={() => setFiltroResumo("ATIVO")}
          />

          <TecnicoMetricCard
            icon={CircleMinusIcon}
            label="Técnicos inativos"
            value={<MetricValue value={totalInativos} loading={loadingInicial} />}
            badge="Fora da escala"
            badgeClass={totalInativos > 0 ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300" : ""}
            footer={loadingInicial ? "Conferindo status..." : `${totalInativos} sem operação ativa`}
            selected={filtroResumo === "INATIVO"}
            onClick={() => setFiltroResumo("INATIVO")}
          />

          <TecnicoMetricCard
            icon={RefreshCcwIcon}
            label="Com alertas resolvidos"
            value={<MetricValue value={tecnicosComAtendimentosResolvidos} loading={loadingInicial} />}
            badge="Resolvidos"
            badgeClass={tecnicosComAtendimentosResolvidos > 0 ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : ""}
            footer={loadingInicial ? "Sincronizando atendimentos" : `${totalAlertasAtendidos} alertas atendidos`}
            selected={filtroResumo === "COM_ALERTAS"}
            onClick={() => setFiltroResumo("COM_ALERTAS")}
          />
        </div>

        {/* Busca */}
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, especialidade ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8 dark:border-gray-600" />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando técnicos da página com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Não foi possível carregar os técnicos."} tone="error" />
        ) : (
          <>
        {/* Tabela */}
        <div className="flex flex-col gap-4 md:hidden">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TecnicoMobileCard key={row.id} tecnico={row.original} onOpen={abrirVer} />
            ))
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum técnico encontrado.
            </div>
          )}
        </div>

        <div className="hidden min-h-[500px] overflow-auto rounded-lg border bg-card md:block dark:border-gray-700! dark:bg-[#0F172A]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow className="relative z-0" key={row.id}>
                    {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Nenhum técnico encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination table={table} countLabel={`${tecnicosFiltrados.length} resultado(s) - ${filtroResumoLabel}`} disabled={carregando} />
          </>
        )}

        {/* Sheet criar / editar / ver */}
        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" mobileSide="bottom" className="w-full max-w-none! sm:w-[420px]! sm:max-w-none!">
            <div key={modoSheet} className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-right-4 duration-200">
            <SheetHeader>
              <SheetTitle>
                {modoSheet === "criar" ? "Novo técnico" : modoSheet === "editar" ? "Editar técnico" : "Detalhes do técnico"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar" ? "Preencha os dados para cadastrar um novo técnico." :
                  modoSheet === "editar" ? "Altere os dados e clique em salvar." :
                    "Informações completas do técnico."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">

              {/* ── MODO VER ── */}
              {modoSheet === "ver" && tecnicoSelecionado ? (
                <>
                  {/* Avatar + nome em destaque */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-linear-to-r from-purple-50 to-violet-50 border border-purple-100 dark:from-primary/10 dark:to-muted/30 dark:border-primary/30">
                    <TecnicoAvatar tecnico={tecnicoSelecionado} size="lg" onClick={() => abrirFotoFullscreen(tecnicoSelecionado)} />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-base text-[#3B2867] dark:text-white">{tecnicoSelecionado.nome}</span>
                      <span className="text-sm text-muted-foreground">{tecnicoSelecionado.especialidade}</span>
                      <StatusTecnicoBadge value={tecnicoSelecionado.status} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ["E-mail", tecnicoSelecionado.email],
                      ["Telefone", formatarTelefoneExibicao(tecnicoSelecionado.telefone)],
                      ["Cadastrado", formatarCadastroTecnico(tecnicoSelecionado.criadoEm)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">{label}</Label>
                        <span className="text-sm font-medium break-all">{value}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">Alertas atendidos</Label>
                    <span className="text-2xl font-bold text-[#3B2867] dark:text-white">{tecnicoSelecionado.alertasAtendidos}</span>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    {tecnicoWhatsappUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-green-200 bg-[#5F18EA]/95 text-white hover:bg-[#5F18EA] hover:text-white dark:border-[#5F18EA]60 dark:bg-[#5F18EA]/30 dark:text-white dark:hover:bg-[#5F18EA]/50"
                      >
                        <a href={tecnicoWhatsappUrl} target="_blank" rel="noreferrer">
                          <img src="/whatsapp-128-svgrepo-com.svg" alt="" className="size-4 invert" />
                          Entrar em contato pelo WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full text-muted-foreground" disabled>
                        Técnico precisa registrar um telefone para contato
                      </Button>
                    )}

                    {canManageTecnicos ? (
                      <div className="flex gap-2">
                        <Button className="cursor-pointer flex-1" onClick={() => abrirEditar(tecnicoSelecionado)} disabled={salvando}>
                          <PencilIcon className="size-4 mr-1" /> Editar
                        </Button>
                        <Button variant="destructive" className="cursor-pointer" onClick={() => confirmarExcluir(tecnicoSelecionado)} disabled={salvando}>
                          <Trash2Icon className="size-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </>

              ) : (

                /* ── MODO CRIAR / EDITAR ── */
                <>
                  {/* Preview do avatar no formulário */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={form.foto || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm dark:bg-primary/20 dark:text-primary-foreground">
                        {form.nome ? getInitials(form.nome) : <ImageIcon className="size-4 text-muted-foreground" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{form.nome || "Nome do técnico"}</span>
                      <span className="text-xs text-muted-foreground">{modoSheet === "criar" ? "Perfil técnico" : form.especialidade}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome completo <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Carlos Eduardo Silva" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="carlos@orbis.com"
                      value={form.email}
                      disabled={modoSheet === "editar"}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value.trim() }))}
                    />
                    {modoSheet === "editar" ? (
                      <p className="text-xs text-muted-foreground">
                        O back-end deste fluxo não altera e-mail na edição do técnico.
                      </p>
                    ) : null}
                  </div>

                  {modoSheet === "criar" ? (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="senha">Senha inicial <span className="text-red-500">*</span></Label>
                      <Input
                        id="senha"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mínimo 7 caracteres"
                        value={form.senha}
                        onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use letra maiuscula, letra minuscula e numero, sem espacos.
                      </p>
                    </div>
                  ) : null}

                  {modoSheet === "editar" ? (
                    <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      value={form.telefone}
                      onChange={e => setForm(p => ({ ...p, telefone: formatBrazilianPhoneInput(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato aceito pela API: DDD + 8 ou 9 digitos.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Select value={form.especialidade} onValueChange={v => setForm(p => ({ ...p, especialidade: v }))}>
                      <SelectTrigger id="especialidade" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {ESPECIALIDADES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                      <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    Foto de perfil não é atualizada por URL neste endpoint. Use o fluxo de upload de foto do perfil.
                  </p>
                    </>
                  ) : null}
                </>
              )}
            </div>

            {modoSheet !== "ver" && (
              <SheetFooter className="px-4 pb-4 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setSheetAberto(false)} disabled={salvando}>Cancelar</Button>
                <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alterações"}</Button>
              </SheetFooter>
            )}
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={Boolean(fotoFullscreen)} onOpenChange={(open) => !open && setFotoFullscreen(null)}>
          <DialogContent className="w-[min(960px,calc(100vw-2rem))]! max-w-none! overflow-hidden p-0">
            <DialogTitle className="sr-only">{fotoFullscreen?.alt ?? "Foto do técnico"}</DialogTitle>
            {fotoFullscreen ? (
              <img
                src={fotoFullscreen.src}
                alt={fotoFullscreen.alt}
                className="block max-h-[calc(100vh-4rem)] w-full bg-muted object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Dialog confirmar exclusão */}
        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{tecnicoExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => alternarDialogExcluir(false)} disabled={salvando}>Cancelar</Button>
              <Button variant="destructive" onClick={excluir} disabled={salvando}>{salvando ? "Excluindo..." : "Excluir"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}
