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
import { RefreshTooltipButton } from "@/components/refresh-tooltip-button"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { fetchDashboardJson, getHttpErrorStatus, normalizeAdminCollection, requestDashboardJson } from "@/lib/dashboard-api"
import { runAfterCurrentOverlayCloses } from "@/lib/deferred-ui"
import {
  formatBrazilianPhoneInput,
  isValidBackendPassword,
  isValidBrazilianPhone,
  isValidEmail,
} from "@/lib/form-formatters"
import { tempoRelativo } from "@/lib/utils"
import { getWhatsappUrl } from "@/lib/whatsapp-url.mjs"

const formVazio = {
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  status: "ATIVO",
  foto: "",
}

const ADMIN_PAGE_SIZE = 10
const ADMIN_FETCH_WINDOW_SIZE = 100

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
  throw new Error("Não foi possível localizar um endpoint de leitura de administradores na API.")
}

async function fetchAdminsFromUsuariosCollection(accessToken) {
  const admins = []
  let page = 1
  let totalPages = 1
  let lastError = null

  do {
    const endpoints = [
      `/usuarios/?page=${page}&limit=${ADMIN_FETCH_WINDOW_SIZE}`,
      `/usuarios?page=${page}&limit=${ADMIN_FETCH_WINDOW_SIZE}`,
    ]
    let payload = null

    for (const endpoint of endpoints) {
      try {
        payload = await requestDashboardJson(endpoint, accessToken, "os administradores")
        break
      } catch (error) {
        lastError = error
      }
    }

    if (!payload) {
      throw lastError ?? new Error("Nao foi possivel carregar os administradores.")
    }

    admins.push(...normalizeAdminCollection(payload))
    totalPages = Number(payload?.totalPages ?? totalPages)

    if (!Number.isFinite(totalPages) || totalPages < page) {
      totalPages = page
    }

    page += 1
  } while (page <= totalPages)

  return admins
}

function AdminAvatar({ admin, size = "default", onClick }) {
  const sizeClass = size === "lg"
    ? "h-16 w-16 text-xl"
    : size === "sm"
      ? "h-18 w-18 text-xs"
      : "h-8 w-8 text-xs"
  const avatar = (
    <Avatar className={sizeClass}>
      <AvatarImage src={admin.foto || undefined} alt={admin.nome} />
      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold dark:bg-primary/20 dark:text-primary-foreground">
        {getInitials(admin.nome)}
      </AvatarFallback>
    </Avatar>
  )

  if (admin.foto && typeof onClick === "function") {
    return (
      <button
        type="button"
        aria-label={`Ver foto de ${admin.nome} em tela cheia`}
        className="cursor-pointer rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB] focus-visible:ring-offset-2"
        onClick={onClick}
      >
        {avatar}
      </button>
    )
  }

  return avatar
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
  const [fotoFullscreen, setFotoFullscreen] = React.useState(null)
  const [form, setForm] = React.useState(formVazio)
  const [dialogExcluir, setDialogExcluir] = React.useState(false)
  const [adminExcluir, setAdminExcluir] = React.useState(null)
  const [limiteItems] = React.useState(ADMIN_PAGE_SIZE)
  const [paginaAtual, setPaginaAtual] = React.useState(1)
  const [totalPaginas, setTotalPaginas] = React.useState(1)
  const [filtroResumo, setFiltroResumo] = React.useState("TODOS")
  const adminIdParam = searchParams.get("adminId")
  const adminAbertoPelaUrlRef = React.useRef(null)

  const canViewAdmins = permissions.canViewAdmins
  const canManageAdmins = permissions.canManageAdmins
  const loadingInicial = status === "loading" && admins.length === 0
  const errorSemDados = status === "error" && admins.length === 0
  const adminWhatsappUrl = getWhatsappUrl(adminSelecionado?.telefone)
  const totalAtivos = React.useMemo(() => admins.filter((admin) => admin.status === "ATIVO").length, [admins])
  const totalInativos = React.useMemo(() => admins.filter((admin) => admin.status === "INATIVO").length, [admins])

  function abrirFotoFullscreen(admin) {
    if (!admin?.foto) return

    setFotoFullscreen({
      src: admin.foto,
      alt: admin.nome ? `Foto de ${admin.nome}` : "Foto do administrador",
    })
  }

  const carregarAdmins = React.useCallback(async (page = 1, limit = ADMIN_PAGE_SIZE) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setAdmins([])
      setStatus("error")
      setMensagem("Faça login para carregar os administradores.")
      return
    }

    setStatus("loading")
    setMensagem("Carregando administradores...")

    try {
      const resolved = await fetchAdminsPayload(session.accessToken, page, limit)
      let normalizedAdmins = normalizeAdminCollection(resolved.payload, {
        assumeAdminWhenRoleMissing: resolved.source !== "usuarios",
      })
      let totalAdmins = getPayloadTotal(resolved.payload, normalizedAdmins.length)
      let totalPages = resolved.payload?.totalPages

      if (resolved.source.startsWith("usuarios")) {
        const allAdmins = await fetchAdminsFromUsuariosCollection(session.accessToken)
        const startIndex = (page - 1) * limit

        normalizedAdmins = allAdmins.slice(startIndex, startIndex + limit)
        totalAdmins = allAdmins.length
        totalPages = Math.max(Math.ceil(totalAdmins / limit), 1)
      }

      setAdmins(normalizedAdmins)
      setTotalPaginas(totalPages ? Number(totalPages) : Math.max(Math.ceil(totalAdmins / limit), 1))
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
          ? "A API bloqueou a leitura de administradores para este técnico."
          : error instanceof Error
            ? error.message
            : "Não foi possível carregar os administradores."
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
        toast.error("Faça login para visualizar o administrador.")
        return
      }

      try {
        const payload = await fetchDashboardJson(`/usuarios/${adminId}`, session.accessToken, "o administrador")
        const [adminNormalizado] = normalizeAdminCollection({ dados: [payload] })

        if (cancelado) return

        if (!adminNormalizado) {
          toast.error("Administrador não encontrado.")
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
          toast.error(error instanceof Error ? error.message : "Não foi possível carregar o administrador.")
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
      toast.error("Faça login para gerenciar administradores.")
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
      toast.error("Informe um e-mail válido para o administrador.")
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
          contextLabel: "a atualização do administrador",
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
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o administrador.")
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
        contextLabel: "a exclusão do administrador",
      })
      toast.success("Administrador removido.")
      setDialogExcluir(false)
      setSheetAberto(false)
      setAdminExcluir(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o administrador.")
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
    if (filtroResumo === "ATIVO") return "Ativos"
    if (filtroResumo === "INATIVO") return "Inativos"
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
            className="cursor-pointer text-left font-medium text-sm hover:underline hover:text-primary transition-colors"
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
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.telefone || "Não informado"}</span>,
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
                  <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
                    <EllipsisVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => abrirVer(row.original))}><EyeIcon className="size-4 mr-1" /> Ver detalhes</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => runAfterCurrentOverlayCloses(() => abrirEditar(row.original))}><PencilIcon className="size-4 mr-1" /> Editar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" variant="destructive" onSelect={() => runAfterCurrentOverlayCloses(() => confirmarExcluir(row.original))}><Trash2Icon className="size-4 mr-1" /> Excluir</DropdownMenuItem>
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
            <Button className={"cursor-pointer"} variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon size={22} className="text-[#3B2867] dark:text-white" />
              <h1 className="text-lg font-medium text-[#3B2867] dark:text-white">Administradores</h1>
            </div>
          </div>
          {canManageAdmins ? (
            <Button onClick={abrirCriar} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90" disabled={salvando}>
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
              <RefreshTooltipButton
                onClick={() => carregarAdmins(paginaAtual, limiteItems)}
                disabled={status === "loading" || salvando}
                successMessage="Atualização dos administradores concluída."
              />
            </div>
          </div>
        ) : null}

        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            className="pl-8 dark:border-gray-600"
          />
        </div>

        {loadingInicial ? (
          <StatePanel message="Sincronizando administradores com a API..." />
        ) : errorSemDados ? (
          <StatePanel message={mensagem || "Não foi possível carregar os administradores."} tone="error" />
        ) : (
          <>
            <div className="overflow-auto rounded-lg border bg-card dark:border-gray-700! dark:bg-[#0F172A]">
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
              <span className="text-sm text-muted-foreground">{adminsFiltrados.length} resultado(s) nesta página - {filtroResumoLabel}</span>
              <div className="flex w-full items-center justify-end gap-8 lg:w-fit">
                <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => carregarAdmins(1, limiteItems)} disabled={paginaAtual <= 1 || status === "loading"}>
                  <ChevronsLeftIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => carregarAdmins(paginaAtual - 1, limiteItems)} disabled={paginaAtual <= 1 || status === "loading"}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm">Pág. {paginaAtual} de {Math.max(totalPaginas, 1)}</span>
                <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => carregarAdmins(paginaAtual + 1, limiteItems)} disabled={paginaAtual >= totalPaginas || status === "loading"}>
                  <ChevronRightIcon className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => carregarAdmins(totalPaginas, limiteItems)} disabled={paginaAtual >= totalPaginas || status === "loading"}>
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
                    : "Informações completas do administrador."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
              {modoSheet === "ver" && adminSelecionado ? (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-linear-to-r from-purple-50 to-violet-50 border border-purple-100 dark:from-primary/10 dark:to-muted/30 dark:border-primary/30">
                    <AdminAvatar admin={adminSelecionado} size="lg" onClick={() => abrirFotoFullscreen(adminSelecionado)} />
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
                      ["Telefone", adminSelecionado.telefone || "Não informado"],
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

                  <div className="flex flex-col gap-2">
                    {adminWhatsappUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-green-200 bg-[#5F18EA]/95 text-white hover:bg-[#5F18EA] hover:text-white dark:border-[#5F18EA]60 dark:bg-[#5F18EA]/30 dark:text-white dark:hover:bg-[#5F18EA]/50"
                      >
                        <a href={adminWhatsappUrl} target="_blank" rel="noreferrer">
                          <img src="/whatsapp-128-svgrepo-com.svg" alt="" className="size-4 invert" />
                          Entrar em contato pelo WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full text-muted-foreground" disabled>
                        Administrador precisa registrar um telefone para contato
                      </Button>
                    )}

                    {canManageAdmins ? (
                      <div className="flex gap-2">
                        <Button className="cursor-pointer flex-1" onClick={() => abrirEditar(adminSelecionado)} disabled={salvando}>
                          <PencilIcon className="size-4 mr-1" /> Editar
                        </Button>
                        <Button variant="destructive" className="cursor-pointer" onClick={() => confirmarExcluir(adminSelecionado)} disabled={salvando}>
                          <Trash2Icon className="size-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    ) : null}
                  </div>
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
                      <p className="text-xs text-muted-foreground">O back-end deste fluxo não altera e-mail na edição do administrador.</p>
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
                        onChange={(event) => setForm((prev) => ({ ...prev, senha: event.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Use letra maiúscula, letra minúscula e número, sem espaços.</p>
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
                <Button variant="outline" className="cursor-pointer" onClick={() => setSheetAberto(false)} disabled={salvando}>Cancelar</Button>
                <Button className="cursor-pointer" onClick={salvar} disabled={salvando}>
                  {salvando ? "Salvando..." : modoSheet === "criar" ? "Cadastrar" : "Salvar alterações"}
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={Boolean(fotoFullscreen)} onOpenChange={(open) => !open && setFotoFullscreen(null)}>
          <DialogContent className="w-[min(960px,calc(100vw-2rem))]! max-w-none! overflow-hidden p-0">
            <DialogTitle className="sr-only">{fotoFullscreen?.alt ?? "Foto do administrador"}</DialogTitle>
            {fotoFullscreen ? (
              <img
                src={fotoFullscreen.src}
                alt={fotoFullscreen.alt}
                className="block max-h-[calc(100vh-4rem)] w-full bg-muted object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={dialogExcluir} onOpenChange={alternarDialogExcluir}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>{adminExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => alternarDialogExcluir(false)} disabled={salvando}>Cancelar</Button>
              <Button variant="destructive" className="cursor-pointer" onClick={excluir} disabled={salvando}>{salvando ? "Excluindo..." : "Excluir"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
