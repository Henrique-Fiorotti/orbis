"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowLeftIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  CircleMinusIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SiteHeader } from "@/components/site-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { fetchDashboardJson, getHttpErrorStatus, normalizeAdminCollection, requestDashboardJson } from "@/lib/dashboard-api"
import {
  formatBrazilianPhoneInput,
  isValidBackendPassword,
  isValidBrazilianPhone,
  isValidEmail,
} from "@/lib/form-formatters"
import { tempoRelativo } from "@/lib/utils"

const formVazio = {
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  status: "ATIVO",
  foto: "",
}

const cardResumoBaseClass = "rounded-xl border bg-card p-4 flex flex-col gap-3 text-left shadow-sm transition-colors"

function getAdminsEndpoints(page, limit) {
  return [
    { endpoint: `/usuarios/?page=${page}&limit=${limit}&role=ADMIN`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios?page=${page}&limit=${limit}&role=ADMIN`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios/?role=ADMIN&page=${page}&limit=${limit}`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios?role=ADMIN&page=${page}&limit=${limit}`, source: "usuarios-filtered", optional: true },
    { endpoint: `/usuarios/admins/?page=${page}&limit=${limit}`, source: "admins", optional: true },
    { endpoint: `/usuarios/admins?page=${page}&limit=${limit}`, source: "admins", optional: true },
    { endpoint: `/admins/?page=${page}&limit=${limit}`, source: "admins", optional: true },
    { endpoint: `/admins?page=${page}&limit=${limit}`, source: "admins", optional: true },
    { endpoint: `/usuarios/?page=${page}&limit=${limit}`, source: "usuarios" },
    { endpoint: `/usuarios?page=${page}&limit=${limit}`, source: "usuarios" },
  ]
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function getPayloadTotal(payload, fallback) {
  const total = Number(payload?.total ?? payload?.count ?? payload?.totalRegistros)
  return Number.isFinite(total) ? total : fallback
}

function getInitials(nome) {
  return normalizeString(nome)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("") || "AD"
}

function normalizarBusca(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

async function fetchAdminsPayload(accessToken, page, limit) {
  let lastRecoverableError = null

  for (const candidate of getAdminsEndpoints(page, limit)) {
    try {
      const payload = await requestDashboardJson(candidate.endpoint, accessToken, "os administradores")
      return { payload, source: candidate.source }
    } catch (error) {
      const status = getHttpErrorStatus(error)
      const recoverableStatusCodes = candidate.optional ? [400, 403, 404, 500] : [400, 403, 404]

      if (recoverableStatusCodes.includes(Number(status))) {
        lastRecoverableError = error
        continue
      }

      throw error
    }
  }

  if (lastRecoverableError) throw lastRecoverableError
  throw new Error("Nao foi possivel localizar um endpoint de leitura de administradores na API.")
}

function AdminAvatar({ admin, size = "default" }) {
  const sizeClass = size === "lg"
    ? "h-16 w-16 text-xl"
    : size === "sm"
      ? "h-18 w-18 text-xs"
      : "h-8 w-8 text-xs"

  return (
    <Avatar className={sizeClass}>
      <AvatarImage src={admin.foto || undefined} alt={admin.nome} />
      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold dark:bg-primary/20 dark:text-primary-foreground">
        {getInitials(admin.nome)}
      </AvatarFallback>
    </Avatar>
  )
}

function StatusAdminBadge({ value }) {
  const isAtivo = value === "ATIVO"

  return (
    <Badge variant="outline" className={`px-1.5 ${isAtivo ? "text-green-700 bg-green-50 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300" : "text-gray-500 bg-gray-50 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground"}`}>
      {isAtivo ? <CircleCheckIcon className="fill-green-600!" /> : <CircleMinusIcon className="text-gray-400 dark:text-muted-foreground" />}
      {isAtivo ? "Ativo" : "Inativo"}
    </Badge>
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

function formatMetric(value, loading, suffix = "") {
  return loading ? "--" : `${value}${suffix}`
}

export default function AdminsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const permissions = useDashboardPermissions()

  const [admins, setAdmins] = React.useState([])
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando administradores...")
  const [salvando, setSalvando] = React.useState(false)
  const [busca, setBusca] = React.useState("")
  const [sheetAberto, setSheetAberto] = React.useState(false)
  const [modoSheet, setModoSheet] = React.useState("criar")
  const [adminSelecionado, setAdminSelecionado] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [adminExcluir, setAdminExcluir] = React.useState(null)
  const [limiteItems] = React.useState(10)
  const [paginaAtual, setPaginaAtual] = React.useState(1)
  const [totalPaginas, setTotalPaginas] = React.useState(1)
  const [filtroResumo, setFiltroResumo] = React.useState("TODOS")
  const adminIdParam = searchParams.get("adminId")
  const adminAbertoPelaUrlRef = React.useRef(null)

  const canViewAdmins = permissions.canViewAdmins
  const canManageAdmins = permissions.canManageAdmins
  const loadingInicial = status === "loading" && admins.length === 0
  const errorSemDados = status === "error" && admins.length === 0
  const totalAtivos = React.useMemo(() => admins.filter((admin) => admin.status === "ATIVO").length, [admins])
  const totalInativos = React.useMemo(() => admins.filter((admin) => admin.status === "INATIVO").length, [admins])

  const carregarAdmins = React.useCallback(async (page = 1, limit = 10) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setAdmins([])
      setStatus("error")
      setMensagem("Faca login para carregar os administradores.")
      return
    }

    setStatus("loading")
    setMensagem("Carregando administradores...")

    try {
      const resolved = await fetchAdminsPayload(session.accessToken, page, limit)
      const normalizedAdmins = normalizeAdminCollection(resolved.payload, {
        assumeAdminWhenRoleMissing: resolved.source !== "usuarios",
      })
      const totalAdmins = resolved.source === "usuarios" ? normalizedAdmins.length : getPayloadTotal(resolved.payload, normalizedAdmins.length)

      setAdmins(normalizedAdmins)
      setTotalPaginas(
        resolved.payload?.totalPages
          ? resolved.payload.totalPages
          : Math.max(Math.ceil(totalAdmins / limit), 1)
      )
      setPaginaAtual(page)
      setStatus("success")
      setMensagem("")
    } catch (error) {
      const statusCode = getHttpErrorStatus(error)

      if (statusCode === 401) {
        clearAuthSession()
        router.replace("/")
        return
      }

      setAdmins([])
      setStatus("error")
      setMensagem(
        statusCode === 403 && permissions.isTecnico
          ? "A API bloqueou a leitura de administradores para este tecnico."
          : error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os administradores."
      )
    }
  }, [permissions.isTecnico, router])

  React.useEffect(() => {
    if (!canViewAdmins) {
      router.replace("/dashboard")
    }
  }, [canViewAdmins, router])

  React.useEffect(() => {
    if (!canViewAdmins) return

    carregarAdmins(1, limiteItems)
  }, [canViewAdmins, carregarAdmins, limiteItems])

  React.useEffect(() => {
    if (!canManageAdmins) return

    if (searchParams.get("action") === "new") {
      abrirCriar()
    }
  }, [canManageAdmins, searchParams])

  React.useEffect(() => {
    if (!canViewAdmins) return

    if (!adminIdParam) {
      adminAbertoPelaUrlRef.current = null
      return
    }

    const adminId = Number(adminIdParam)

    if (!Number.isFinite(adminId)) return

    const adminIdKey = String(adminId)

    if (adminAbertoPelaUrlRef.current === adminIdKey) return

    const adminEncontrado = admins.find((admin) => admin.id === adminId)

    if (adminEncontrado) {
      adminAbertoPelaUrlRef.current = adminIdKey
      abrirVer(adminEncontrado)
      return
    }

    if (status === "loading") return

    let cancelado = false

    async function carregarAdminPorId() {
      const session = getAuthSession()

      if (!session?.accessToken) {
        toast.error("Faca login para visualizar o administrador.")
        return
      }

      try {
        const payload = await fetchDashboardJson(`/usuarios/${adminId}`, session.accessToken, "o administrador")
        const [adminNormalizado] = normalizeAdminCollection({ dados: [payload] })

        if (cancelado) return

        if (!adminNormalizado) {
          toast.error("Administrador nao encontrado.")
          return
        }

        adminAbertoPelaUrlRef.current = adminIdKey
        abrirVer(adminNormalizado)
      } catch (error) {
        if (getHttpErrorStatus(error) === 401) {
          clearAuthSession()
          router.replace("/")
          return
        }

        if (!cancelado) {
          toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar o administrador.")
        }
      }
    }

    carregarAdminPorId()

    return () => {
      cancelado = true
    }
  }, [adminIdParam, admins, canViewAdmins, router, status])

  function abrirCriar() {
    setModoSheet("criar")
    setForm(formVazio)
    setAdminSelecionado(null)
    setSheetAberto(true)
  }

  function abrirEditar(admin) {
    setModoSheet("editar")
    setForm({
      nome: admin.nome,
      email: admin.email,
      senha: "",
      telefone: admin.telefone,
      status: admin.status,
      foto: admin.foto || "",
    })
    setAdminSelecionado(admin)
    setSheetAberto(true)
  }

  function abrirVer(admin) {
    setModoSheet("ver")
    setAdminSelecionado(admin)
    setSheetAberto(true)
  }

  async function executarMutacao(endpoint, { method, body, contextLabel }) {
    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faca login para gerenciar administradores.")
      return
    }

    setSalvando(true)

    try {
      await requestDashboardJson(endpoint, session.accessToken, contextLabel, { method, body })
      await carregarAdmins(paginaAtual, limiteItems)
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
        router.replace("/")
        return
      }

      throw error
    } finally {
      setSalvando(false)
    }
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
      toast.error("Informe um e-mail valido para o administrador.")
      return
    }

    if (modoSheet === "criar" && !isValidBackendPassword(form.senha)) {
      toast.error("A senha precisa ter 7+ caracteres, letra maiuscula, minuscula e numero.")
      return
    }

    if (modoSheet === "editar" && telefone && !isValidBrazilianPhone(telefone)) {
      toast.error("Informe o telefone no formato (11) 99999-9999.")
      return
    }

    try {
      if (modoSheet === "criar") {
        await executarMutacao("/usuarios", {
          method: "POST",
          contextLabel: "o cadastro do administrador",
          body: {
            nome,
            email,
            senha: form.senha.trim(),
            role: "ADMIN",
          },
        })
        toast.success("Administrador cadastrado com sucesso!")
      } else {
        await executarMutacao(`/usuarios/${adminSelecionado.id}`, {
          method: "PUT",
          contextLabel: "a atualizacao do administrador",
          body: {
            nome,
            ...(telefone ? { telefone } : {}),
            ativo: form.status === "ATIVO",
          },
        })
        toast.success("Administrador atualizado com sucesso!")
      }

      setSheetAberto(false)
      setForm(formVazio)
      setAdminSelecionado(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o administrador.")
    }
  }

  function confirmarExcluir(admin) {
    setAdminExcluir(admin)
    setDialogExcluir(true)
  }

  function alternarDialogExcluir(open) {
    setDialogExcluir(open)

    if (!open) {
      setAdminExcluir(null)
    }
  }

  async function excluir() {
    if (!adminExcluir) return

    try {
      await executarMutacao(`/usuarios/${adminExcluir.id}`, {
        method: "DELETE",
        contextLabel: "a exclusao do administrador",
      })
      toast.success("Administrador removido.")
      setDialogExcluir(false)
      setSheetAberto(false)
      setAdminExcluir(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover o administrador.")
    }
  }

  const adminsFiltrados = React.useMemo(() => {
    const termo = normalizarBusca(busca)

    return admins.filter((admin) => {
      const correspondeResumo = filtroResumo === "TODOS" || admin.status === filtroResumo

      if (!correspondeResumo) return false
      if (!termo) return true

      return [
        admin.nome,
        admin.email,
        admin.telefone,
        admin.status,
        "Administrador",
      ].some((value) => normalizarBusca(value).includes(termo))
    })
  }, [admins, busca, filtroResumo])

  const filtroResumoLabel = React.useMemo(() => {
    if (filtroResumo === "ATIVO") return "ativos"
    if (filtroResumo === "INATIVO") return "inativos"
    return "todos"
  }, [filtroResumo])

  const columns = [
    {
      accessorKey: "nome",
      header: "Administrador",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <AdminAvatar admin={row.original} size="sm" />
          <button
            onClick={() => abrirVer(row.original)}
            className="text-left font-medium text-sm hover:underline hover:text-primary transition-colors"
          >
            {row.original.nome}
          </button>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Perfil",
      cell: () => <Badge variant="outline" className="px-1.5 bg-purple-100 text-purple-700 border-purple-200 dark:border-primary/40 dark:bg-primary/10 dark:text-primary-foreground">Administrador</Badge>,
    },
    {
      accessorKey: "email",
      header: "E-mail",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: "telefone",
      header: "Telefone",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.telefone || "Nao informado"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusAdminBadge value={row.original.status} />,
    },
    // {
    //   accessorKey: "criadoEm",
    //   header: "Cadastrado",
    //   cell: ({ row }) => <span className="text-muted-foreground text-sm">{tempoRelativo(row.original.criadoEm)}</span>,
    // },
    ...(canManageAdmins
      ? [
          {
            id: "actions",
            cell: ({ row }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
                    <EllipsisVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => abrirVer(row.original)}><EyeIcon className="size-4 mr-1" /> Ver detalhes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => abrirEditar(row.original)}><PencilIcon className="size-4 mr-1" /> Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => confirmarExcluir(row.original)}><Trash2Icon className="size-4 mr-1" /> Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]
      : []),
  ]

  const table = useReactTable({
    data: adminsFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (!canViewAdmins) {
    return null
  }

  function getResumoCardClass(filtro) {
    return `${cardResumoBaseClass} ${
      filtroResumo === filtro
        ? "border-[#5E17EB]! ring-2 ring-[#5E17EB]/30"
        : "hover:border-[#5E17EB]! hover:ring-[#5E17EB]/50"
    }`
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon size={22} className="text-[#3B2867] dark:text-white" />
              <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Administradores</h1>
            </div>
          </div>
          {canManageAdmins ? (
            <Button onClick={abrirCriar} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
              <PlusIcon className="size-4 mr-1" />Novo admin
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
              <Button variant="outline" size="sm" onClick={() => carregarAdmins(paginaAtual, limiteItems)} disabled={status === "loading" || salvando}>
                <RefreshCcwIcon className="mr-1 size-4" />
                Atualizar
              </Button>
            </div>
          </div>
        ) : null}

        {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button type="button" className={getResumoCardClass("TODOS")} onClick={() => setFiltroResumo("TODOS")}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total de administradores</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {loadingInicial ? "Sincronizando" : `${totalAtivos} ativos`}
              </span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{formatMetric(admins.length, loadingInicial)}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
                <CircleCheckIcon className="size-3.5 fill-green-600" />
                {loadingInicial ? "Atualizando equipe..." : `${totalAtivos} com acesso ativo`}
              </span>
              <span className="text-muted-foreground flex items-center gap-1">
                <CircleMinusIcon className="size-3.5 text-gray-400 dark:text-muted-foreground" />
                {loadingInicial ? "Conferindo status..." : `${totalInativos} inativos`}
              </span>
            </div>
          </button>

          <button type="button" className={getResumoCardClass("ATIVO")} onClick={() => setFiltroResumo("ATIVO")}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Admins ativos</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">operando</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{formatMetric(totalAtivos, loadingInicial)}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-green-700 dark:text-green-300 flex items-center gap-1">
                <CircleCheckIcon className="size-3.5 fill-green-600" />
                {loadingInicial ? "Atualizando equipe..." : `${totalAtivos} disponiveis`}
              </span>
              <span className="text-muted-foreground text-xs">Clique para ver somente administradores ativos</span>
            </div>
          </button>

          <button type="button" className={getResumoCardClass("INATIVO")} onClick={() => setFiltroResumo("INATIVO")}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Admins inativos</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">sem acesso</span>
            </div>
            <span className="text-3xl font-bold text-[#3B2867] dark:text-white">{formatMetric(totalInativos, loadingInicial)}</span>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <CircleMinusIcon className="size-3.5 text-gray-400 dark:text-muted-foreground" />
                {loadingInicial ? "Conferindo status..." : `${totalInativos} sem acesso ativo`}
              </span>
              <span className="text-muted-foreground text-xs">Clique para ver somente administradores inativos</span>
            </div>
          </button>
        </div> */}

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-8"
          />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando administradores com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Nao foi possivel carregar os administradores."} tone="error" />
        ) : (
          <>
            <div className="min-h-[500px] overflow-auto rounded-lg border bg-card dark:border-gray-700! dark:bg-[#0F172A]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow className="relative z-0" key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                        Nenhum administrador encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{adminsFiltrados.length} resultado(s) nesta pagina - {filtroResumoLabel}</span>
              <div className="flex w-full items-center justify-end gap-8 lg:w-fit">
                <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => carregarAdmins(1, limiteItems)} disabled={paginaAtual <= 1 || status === "loading"}>
                  <ChevronsLeftIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => carregarAdmins(paginaAtual - 1, limiteItems)} disabled={paginaAtual <= 1 || status === "loading"}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm">Pag. {paginaAtual} de {Math.max(totalPaginas, 1)}</span>
                <Button variant="outline" size="icon" className="size-8" onClick={() => carregarAdmins(paginaAtual + 1, limiteItems)} disabled={paginaAtual >= totalPaginas || status === "loading"}>
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => carregarAdmins(totalPaginas, limiteItems)} disabled={paginaAtual >= totalPaginas || status === "loading"}>
                  <ChevronsRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
          <SheetContent side="right" className="w-[420px]! max-w-none! sm:max-w-none!">
            <SheetHeader>
              <SheetTitle>
                {modoSheet === "criar" ? "Novo administrador" : modoSheet === "editar" ? "Editar administrador" : "Detalhes do administrador"}
              </SheetTitle>
              <SheetDescription>
                {modoSheet === "criar"
                  ? "Preencha os dados para cadastrar um novo administrador."
                  : modoSheet === "editar"
                    ? "Altere os dados e clique em salvar."
                    : "Informacoes completas do administrador."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
              {modoSheet === "ver" && adminSelecionado ? (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-linear-to-r from-purple-50 to-violet-50 border border-purple-100 dark:from-primary/10 dark:to-muted/30 dark:border-primary/30">
                    <AdminAvatar admin={adminSelecionado} size="lg" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-base text-[#3B2867] dark:text-white">{adminSelecionado.nome}</span>
                      <span className="text-sm text-muted-foreground">Administrador</span>
                      <StatusAdminBadge value={adminSelecionado.status} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ["E-mail", adminSelecionado.email],
                      ["Telefone", adminSelecionado.telefone || "Nao informado"],
                      ["Perfil", "Administrador"],
                    //   ["Cadastrado", tempoRelativo(adminSelecionado.criadoEm)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">{label}</Label>
                        <span className="text-sm font-medium break-all">{value}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {canManageAdmins ? (
                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={() => abrirEditar(adminSelecionado)} disabled={salvando}>
                        <PencilIcon className="size-4 mr-1" /> Editar
                      </Button>
                      <Button variant="destructive" onClick={() => confirmarExcluir(adminSelecionado)} disabled={salvando}>
                        <Trash2Icon className="size-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={form.foto || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm dark:bg-primary/20 dark:text-primary-foreground">
                        {form.nome ? getInitials(form.nome) : <ImageIcon className="size-4 text-muted-foreground" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{form.nome || "Nome do administrador"}</span>
                      <span className="text-xs text-muted-foreground">Perfil administrador</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome completo <span className="text-red-500">*</span></Label>
                    <Input id="nome" placeholder="Ex: Ana Beatriz Souza" value={form.nome} onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="admin@orbis.com"
                      value={form.email}
                      disabled={modoSheet === "editar"}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value.trim() }))}
                    />
                    {modoSheet === "editar" ? (
                      <p className="text-xs text-muted-foreground">O back-end deste fluxo nao altera e-mail na edicao do administrador.</p>
                    ) : null}
                  </div>

                  {modoSheet === "criar" ? (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="senha">Senha inicial <span className="text-red-500">*</span></Label>
                      <Input
                        id="senha"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Minimo 7 caracteres"
                        value={form.senha}
                        onChange={(event) => setForm((prev) => ({ ...prev, senha: event.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Use letra maiuscula, letra minuscula e numero, sem espacos.</p>
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
                          onChange={(event) => setForm((prev) => ({ ...prev, telefone: formatBrazilianPhoneInput(event.target.value) }))}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                          <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="ATIVO">Ativo</SelectItem>
                              <SelectItem value="INATIVO">Inativo</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>

            {modoSheet !== "ver" && (
              <SheetFooter className="px-4 pb-4">
                <Button variant="outline" onClick={() => setSheetAberto(false)} disabled={salvando}>Cancelar</Button>
                <Button onClick={salvar} disabled={salvando}>
                  {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alteracoes"}
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusao</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{adminExcluir?.nome}</strong>? Esta acao nao pode ser desfeita.
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
