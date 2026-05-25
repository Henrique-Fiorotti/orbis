"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"

import { useDashboardCharts } from "./context/dashboard-charts-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { useAlertas } from "@/components/context/alertas-context"
import { DashboardTableSkeleton } from "@/components/dashboard-skeletons"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MaquinaDetailsPanel, MaquinaImagePreview } from "@/components/maquina-details-panel"
import { TableColumnHeaderMenu } from "@/components/table-column-header-menu"
import { TablePagination } from "@/components/table-pagination"
import { CircleCheckIcon, CircleMinusIcon, AlertTriangleIcon, ImageIcon, EllipsisVerticalIcon, ChevronDownIcon, PlusIcon, ArrowRightIcon, SlidersHorizontalIcon, WashingMachineIcon } from "lucide-react"
import { runAfterCurrentOverlayCloses } from "@/lib/deferred-ui"
import { cn, tempoRelativo } from "@/lib/utils"
import {
  MAQUINA_IMPORTANCIA_FILTER_OPTIONS as IMPORTANCIA_FILTER_OPTIONS,
  MAQUINA_IMPORTANCIA_SORT_OPTIONS as IMPORTANCIA_SORT_OPTIONS,
  MAQUINA_INTEGRIDADE_FILTER_OPTIONS as INTEGRIDADE_FILTER_OPTIONS,
  MAQUINA_INTEGRIDADE_SORT_OPTIONS as INTEGRIDADE_SORT_OPTIONS,
  MAQUINA_STATUS_FILTER_OPTIONS as STATUS_FILTER_OPTIONS,
  MAQUINA_STATUS_SORT_OPTIONS as STATUS_SORT_OPTIONS,
  getMaquinaIntegridadeExibicao,
  getMaquinaStatusExibicao,
  getMaquinaUltimaLeituraExibicao,
  importanciaMaquinaSortFn,
  integridadeMaquinaFilterFn as integridadeFilterFn,
  selectMaquinaFilterFn as selectFilterFn,
  statusMaquinaSortFn,
  withMaquinaAlertasStatus,
} from "@/lib/maquinas-table"

const FILTER_ALL_VALUE = "__all__"

function CriticidadeBadge({ value }) {
  const styles = {
    ALTA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
    MEDIA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
    BAIXA: "bg-white text-gray-700 border-gray-200 dark:border-border dark:bg-muted/30 dark:text-muted-foreground",
  }
  return <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function StatusBadge({ value }) {
  if (value === "SEM_SENSOR") {
    return (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        <CircleMinusIcon className="text-muted-foreground" />
        Sem sensor
      </Badge>
    )
  }

  if (value === "EM_ANDAMENTO") {
    return (
      <Badge variant="outline" className="px-1.5 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
        <AlertTriangleIcon className="text-orange-500 dark:text-orange-300" />
        Em andamento
      </Badge>
    )
  }

  if (value === "COM_ALERTA") {
    return (
      <Badge variant="outline" className="px-1.5 border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        <AlertTriangleIcon className="text-red-500 dark:text-red-300" />
        Com alerta
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]!" /> : <AlertTriangleIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value, inactive = false }) {
  const normalizedValue = Math.round(Number(value))

  if (inactive || !Number.isFinite(normalizedValue)) {
    return (
      <div className="flex flex-row-reverse items-center gap-2 min-w-[110px]">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-full rounded-full bg-muted-foreground/20" />
        </div>
        <span className="text-sm font-medium w-9 text-right tabular-nums text-muted-foreground">--</span>
      </div>
    )
  }

  const cor = normalizedValue < 50 ? "bg-red-500" : normalizedValue < 75 ? "bg-yellow-400" : "bg-green-500"
  const textCor = normalizedValue < 50 ? "text-red-500" : normalizedValue < 75 ? "text-yellow-500" : "text-green-600"

  return (
    <div className="flex flex-row-reverse items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${normalizedValue}%` }} />
      </div>
      <span className={`text-sm font-medium w-9 text-right tabular-nums ${textCor}`}>{normalizedValue}%</span>
    </div>
  )
}

function MaquinaMobileCard({ maquina, onOpen }) {
  const status = getMaquinaStatusExibicao(maquina)
  const integridade = getMaquinaIntegridadeExibicao(maquina)
  const normalizedIntegridade = Math.round(Number(integridade))
  const hasIntegridade = status !== "SEM_SENSOR" && Number.isFinite(normalizedIntegridade)
  const integridadeTextColor = normalizedIntegridade < 50 ? "text-red-500 dark:text-red-300" : normalizedIntegridade < 75 ? "text-yellow-500 dark:text-yellow-300" : "text-green-600 dark:text-green-300"

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-4 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:border-[#5E17EB] focus-visible:border-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/20 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(maquina)}
    >
      <span className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground">
        {maquina.imagem ? (
          <img src={maquina.imagem} alt="" className="size-full object-cover" />
        ) : (
          <WashingMachineIcon className="size-16 stroke-1 text-muted-foreground/35" />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="line-clamp-2 text-xl font-medium leading-tight text-foreground">{maquina.nome}</span>
          <span className="text-sm text-muted-foreground">{maquina.setor}</span>
        </span>

        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            {hasIntegridade ? (
              <span className={`w-12 text-lg font-medium tabular-nums ${integridadeTextColor}`}>
                {normalizedIntegridade}%
              </span>
            ) : (
              <span className="w-12 text-lg font-medium tabular-nums text-muted-foreground">--</span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <CriticidadeBadge value={maquina.criticidade} />
            <StatusBadge value={status} />
          </span>
        </span>
      </span>
    </button>
  )
}

function MobileFilterSection({ title, value, options, onChange }) {
  const currentValue = value ?? FILTER_ALL_VALUE

  return (
    <details className="group rounded-lg border bg-background [&>summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-medium">
        <span>{title}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-2 px-3 pb-3">
        <button
          type="button"
          className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${currentValue === FILTER_ALL_VALUE
              ? "border-[#5E17EB] bg-[#5E17EB]/10 text-[#5E17EB]"
              : "bg-card text-muted-foreground hover:border-[#5E17EB]/50"
            }`}
          onClick={() => onChange(undefined)}
        >
          Todos
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${currentValue === option.value
                ? "border-[#5E17EB] bg-[#5E17EB]/10 text-[#5E17EB]"
                : "bg-card text-muted-foreground hover:border-[#5E17EB]/50"
              }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </details>
  )
}

function MobileFiltersMenu({
  open,
  onOpenChange,
  activeCount,
  filters,
  onFilterChange,
  onClear,
}) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-9 cursor-pointer"
          onClick={() => onOpenChange(!open)}
        >
          <SlidersHorizontalIcon className="size-4" />
          Filtros
          {activeCount > 0 ? (
            <Badge variant="outline" className="ml-1 border-[#5E17EB]/40 bg-[#5E17EB]/10 px-1.5 text-[#5E17EB]">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
        {activeCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="cursor-pointer text-muted-foreground" onClick={onClear}>
            Limpar
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
          <MobileFilterSection
            title="Importancia"
            value={filters.criticidade}
            options={IMPORTANCIA_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("criticidade", value)}
          />
          <MobileFilterSection
            title="Status"
            value={filters.status}
            options={STATUS_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("status", value)}
          />
          <MobileFilterSection
            title="Integridade"
            value={filters.integridade}
            options={INTEGRIDADE_FILTER_OPTIONS}
            onChange={(value) => onFilterChange("integridade", value)}
          />
        </div>
      ) : null}
    </div>
  )
}

function StatePanel({ message, tone = "muted", className = "" }) {
  return (
    <div
      className={cn(
        "flex min-h-[500px] items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm",
        tone === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border/60 bg-muted/20 text-muted-foreground",
        className
      )}
    >
      {message}
    </div>
  )
}

function getTableColumns(canManageMaquinas, actions) {
  return [
    {
      accessorKey: "nome",
      header: "Máquina",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="h-auto w-fit cursor-pointer justify-start gap-3 !p-0 text-left text-foreground hover:bg-transparent hover:text-primary"
          onClick={() => actions.onViewDetails(row.original)}
        >
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
            {row.original.imagem ? (
              <img src={row.original.imagem} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </span>
          <span className="cursor-pointer text-sm font-medium hover:underline">{row.original.nome}</span>
        </Button>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "setor",
      header: "Setor",
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.setor}</span>,
    },
    {
      accessorKey: "criticidade",
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Importância"
          filterOptions={IMPORTANCIA_FILTER_OPTIONS}
          sortOptions={IMPORTANCIA_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <CriticidadeBadge value={row.original.criticidade} />,
      filterFn: selectFilterFn,
      sortingFn: importanciaMaquinaSortFn,
    },
    {
      id: "status",
      accessorFn: getMaquinaStatusExibicao,
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Status"
          filterOptions={STATUS_FILTER_OPTIONS}
          sortOptions={STATUS_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <StatusBadge value={row.getValue("status")} />,
      filterFn: selectFilterFn,
      sortingFn: statusMaquinaSortFn,
    },
    {
      id: "integridade",
      accessorFn: getMaquinaIntegridadeExibicao,
      header: ({ column }) => (
        <TableColumnHeaderMenu
          column={column}
          label="Integridade"
          filterOptions={INTEGRIDADE_FILTER_OPTIONS}
          sortOptions={INTEGRIDADE_SORT_OPTIONS}
        />
      ),
      cell: ({ row }) => <IntegridadeBar value={row.getValue("integridade")} inactive={row.getValue("status") === "SEM_SENSOR"} />,
      filterFn: integridadeFilterFn,
    },
    {
      id: "ultimaLeituraEm",
      accessorFn: getMaquinaUltimaLeituraExibicao,
      header: "Último sinal",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("ultimaLeituraEm") ? tempoRelativo(row.getValue("ultimaLeituraEm")) : "Sem leitura"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="cursor-pointer flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
              <EllipsisVerticalIcon />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onSelect={() => runAfterCurrentOverlayCloses(() => actions.onViewDetails(row.original))}>
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => runAfterCurrentOverlayCloses(() => actions.onViewAlerts(row.original))}>
              Ver alertas
            </DropdownMenuItem>
            {canManageMaquinas ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => runAfterCurrentOverlayCloses(() => actions.onManageMachine(row.original))}>
                  Remover
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

function MaquinasTable({
  data,
  sensores = [],
  sensorError = "",
  emptyMessage = "Nenhuma máquina encontrada.",
  className = "",
  columnFilters,
  onColumnFiltersChange,
}) {
  const router = useRouter()
  const [maquinaDetalhe, setMaquinaDetalhe] = React.useState(null)
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [sorting, setSorting] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const permissions = useDashboardPermissions()
  const maquinaDetalheAtual = React.useMemo(() => {
    if (!maquinaDetalhe?.id) {
      return maquinaDetalhe
    }

    return data.find((maquina) => String(maquina.id) === String(maquinaDetalhe.id)) ?? maquinaDetalhe
  }, [maquinaDetalhe, data])
  const actions = React.useMemo(() => ({
    onViewDetails: (maquina) => setMaquinaDetalhe(maquina),
    onViewAlerts: (maquina) => router.push(`/dashboard/alertas?maquina=${encodeURIComponent(maquina.nome)}`),
    onManageMachine: (maquina) => router.push(`/dashboard/maquinas?machineId=${encodeURIComponent(maquina.id)}`),
  }), [router])
  const columns = React.useMemo(
    () => getTableColumns(permissions.canManageMaquinas, actions),
    [permissions.canManageMaquinas, actions]
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination },
    getRowId: (row) => row.id.toString(),
    onSortingChange: setSorting,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <>
      <div className="flex flex-col gap-4 md:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <MaquinaMobileCard key={row.id} maquina={row.original} onOpen={actions.onViewDetails} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      <div className={cn("hidden min-h-[500px] overflow-auto rounded-lg border md:block dark:bg-[#0F172A] dark:border-gray-700!", className)}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="relative z-0 h-14">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        table={table}
        countLabel={`${table.getFilteredRowModel().rows.length} máquina(s) encontrada(s).`}
        showPageSizeSelect
      />
      {maquinaDetalhe ? (
        <MachineDetailsDrawer
          item={maquinaDetalheAtual}
          sensores={sensores}
          sensorError={sensorError}
          open={Boolean(maquinaDetalhe)}
          onOpenChange={(open) => {
            if (!open) {
              setMaquinaDetalhe(null)
            }
          }}
          onViewAlerts={actions.onViewAlerts}
        />
      ) : null}
    </>
  )
}

export function DataTable() {
  const router = useRouter()
  const permissions = useDashboardPermissions()
  const [columnFilters, setColumnFilters] = React.useState([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const {
    status: dashboardStatus,
    mensagem: dashboardMensagem,
    maquinas: dashboardMaquinas,
    sensores,
    errors,
  } = useDashboardCharts()
  const {
    status: maquinasStatus,
    mensagem: maquinasMensagem,
    maquinas: maquinasCadastradas,
  } = useMaquinas()
  const { alertas } = useAlertas()
  const maquinasBase = maquinasCadastradas.length > 0 ? maquinasCadastradas : dashboardMaquinas
  const maquinas = React.useMemo(() => withMaquinaAlertasStatus(maquinasBase, alertas), [alertas, maquinasBase])
  const emAlerta = React.useMemo(
    () => maquinas.filter((maquina) => ["COM_ALERTA", "EM_ANDAMENTO"].includes(getMaquinaStatusExibicao(maquina))),
    [maquinas]
  )
  const loading =
    maquinasStatus === "loading" &&
    dashboardStatus === "loading" &&
    maquinas.length === 0
  const machineError =
    maquinas.length === 0
      ? errors.maquinas ||
      (maquinasStatus === "error" ? maquinasMensagem : "") ||
      (dashboardStatus === "error" ? dashboardMensagem : "")
      : ""
  const sensorNotice = errors.sensores && maquinas.length > 0
    ? `${errors.sensores} Os detalhes dos sensores podem ficar indisponíveis temporariamente.`
    : ""

  const mobileFilterValues = {
    criticidade: columnFilters.find((filter) => filter.id === "criticidade")?.value,
    status: columnFilters.find((filter) => filter.id === "status")?.value,
    integridade: columnFilters.find((filter) => filter.id === "integridade")?.value,
  }
  const activeMobileFilters = Object.values(mobileFilterValues).filter((value) => value !== undefined && value !== "").length

  function alterarFiltroMobile(columnId, value) {
    setColumnFilters((current) => {
      const next = current.filter((filter) => filter.id !== columnId)

      if (value === undefined || value === "") {
        return next
      }

      return [...next, { id: columnId, value }]
    })
  }

  function limparFiltrosMobile() {
    setColumnFilters((current) => current.filter((filter) => !["criticidade", "status", "integridade"].includes(filter.id)))
  }

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6 ">
      <div className="px-4 lg:px-6">
        <MobileFiltersMenu
          open={mobileFiltersOpen}
          onOpenChange={setMobileFiltersOpen}
          activeCount={activeMobileFilters}
          filters={mobileFilterValues}
          onFilterChange={alterarFiltroMobile}
          onClear={limparFiltrosMobile}
        />
      </div>

      <div className="rounded-[8px]! flex flex-nowrap items-center h-[32px] justify-between gap-2 px-4 lg:px-6">
        <TabsList  className="rounded-[8px]! responsivo flex w-fit max-w-full shrink items-center gap-2 overflow-x-auto **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full! **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
          <TabsTrigger className="rounded-[8px]! dark:border-gray-600!" value="outline">Máquinas</TabsTrigger>
          <TabsTrigger className="rounded-[8px]! dark:border-gray-600!" value="alertas">
            Em Alerta
            {emAlerta.length > 0 && (
              <Badge variant="secondary" className="ml-1 border-red-200! bg-red-100! text-red-700!">
                {emAlerta.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <div className="flex shrink-0 items-center gap-2">
          {permissions.canManageMaquinas ? (
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => router.push("/dashboard/maquinas?action=new")}>
              <PlusIcon />
              <span className="hidden lg:inline">Nova máquina</span>
            </Button>
          ) : null}

          <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => router.push("/dashboard/maquinas")}>
            <span className="hidden lg:inline">Ver todas</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {sensorNotice ? (
        <div className="px-4 lg:px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {sensorNotice}
          </div>
        </div>
      ) : null}

      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {loading ? (
          <DashboardTableSkeleton />
        ) : machineError ? (
          <StatePanel message={machineError} tone="error" />
        ) : (
          <MaquinasTable
            data={maquinas}
            sensores={sensores}
            sensorError={errors.sensores}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
          />
        )}
      </TabsContent>

      <TabsContent value="alertas" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {loading ? (
          <DashboardTableSkeleton />
        ) : machineError ? (
          <StatePanel message={machineError} tone="error" />
        ) : emAlerta.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-muted-foreground">
            <CircleCheckIcon className="size-8 text-[#5e17eb]" />
            <p className="text-sm font-medium">Nenhuma máquina em alerta no momento.</p>
            <p className="text-xs">Todas as máquinas estão operando normalmente.</p>
          </div>
        ) : (
          <MaquinasTable
            data={emAlerta}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            sensores={sensores}
            sensorError={errors.sensores}
            emptyMessage="Nenhuma máquina em alerta encontrada."
          />
        )}
      </TabsContent>
    </Tabs>
  )
}

function MachineDetailsDrawer({
  item,
  sensores,
  sensorError = "",
  trigger = null,
  open,
  onOpenChange,
  onViewAlerts,
}) {
  const isMobile = useIsMobile()
  const drawerProps = {
    direction: isMobile ? "bottom" : "right",
  }

  if (open !== undefined) {
    drawerProps.open = open
    drawerProps.onOpenChange = onOpenChange
  }

  return (
    <Drawer {...drawerProps}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent
        className={cn(
          "overflow-hidden",
          isMobile
            ? "!inset-0 !mt-0 !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !rounded-none !border-0"
            : "!w-[420px] !max-w-[420px] sm:!max-w-[420px]"
        )}
      >
        <div className="px-4 pt-4">
          <MaquinaImagePreview maquina={item} />
        </div>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.nome}</DrawerTitle>
          <DrawerDescription>{item.setor} - {item.tipo}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 text-sm">
          <MaquinaDetailsPanel maquina={item} sensores={sensores} sensorError={sensorError} />
        </div>
        <DrawerFooter>
          <Button className="cursor-pointer" onClick={() => onViewAlerts?.(item)}>Ver alertas desta máquina</Button>
          <DrawerClose asChild><Button variant="outline">Fechar</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
