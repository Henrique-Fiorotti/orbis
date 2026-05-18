"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"

import { useDashboardCharts } from "./context/dashboard-charts-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { DashboardTableSkeleton } from "@/components/dashboard-skeletons"
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MaquinaDetailsPanel, MaquinaImagePreview } from "@/components/maquina-details-panel"
import { TableColumnHeaderMenu } from "@/components/table-column-header-menu"
import { CircleCheckIcon, CircleMinusIcon, AlertTriangleIcon, ImageIcon, EllipsisVerticalIcon, Columns3Icon, ChevronDownIcon, PlusIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, ArrowRightIcon } from "lucide-react"
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
} from "@/lib/maquinas-table"

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

  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]!" /> : <AlertTriangleIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value, inactive = false }) {
  const normalizedValue = Number(value)

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

function getTableColumns(sensores, sensorError, canManageMaquinas, actions) {
  return [
    {
      accessorKey: "nome",
      header: "Máquina",
      cell: ({ row }) => (
        <TableCellViewer
          item={row.original}
          sensores={sensores}
          sensorError={sensorError}
          onViewAlerts={actions.onViewAlerts}
        />
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
}) {
  const router = useRouter()
  const [maquinaDetalhe, setMaquinaDetalhe] = React.useState(null)
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState([])
  const [sorting, setSorting] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const permissions = useDashboardPermissions()
  const actions = React.useMemo(() => ({
    onViewDetails: (maquina) => setMaquinaDetalhe(maquina),
    onViewAlerts: (maquina) => router.push(`/dashboard/alertas?maquina=${encodeURIComponent(maquina.nome)}`),
    onManageMachine: (maquina) => router.push(`/dashboard/maquinas?machineId=${encodeURIComponent(maquina.id)}`),
  }), [router])
  const columns = React.useMemo(
    () => getTableColumns(sensores, sensorError, permissions.canManageMaquinas, actions),
    [sensores, sensorError, permissions.canManageMaquinas, actions]
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination },
    getRowId: (row) => row.id.toString(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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
      <div className={cn("min-h-[500px] overflow-auto rounded-lg border dark:bg-[#0F172A] dark:border-gray-700!", className)}>
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
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredRowModel().rows.length} máquina(s) encontrada(s).
        </div>
        <div className="flex w-full items-center gap-4 sm:gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-pp" className="text-sm font-medium">Por página</Label>
            <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="rows-pp">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button variant="outline" className="cursor-pointer hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeftIcon />
            </Button>
            <Button variant="outline" className="cursor-pointer size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="outline" className="cursor-pointer size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRightIcon />
            </Button>
            <Button variant="outline" className="cursor-pointer hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>
      </div>
      {maquinaDetalhe ? (
        <MachineDetailsDrawer
          item={maquinaDetalhe}
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
  const maquinas = maquinasCadastradas.length > 0 ? maquinasCadastradas : dashboardMaquinas
  const emAlerta = React.useMemo(() => maquinas.filter((maquina) => maquina.status === "ALERTA"), [maquinas])
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

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="rounded-[8px]! flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6">
        <TabsList className="rounded-[8px]! hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full! **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
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
        <div className="flex flex-wrap items-center gap-2">
          

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
          <MaquinasTable data={maquinas} sensores={sensores} sensorError={errors.sensores} />
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
            sensores={sensores}
            sensorError={errors.sensores}
            emptyMessage="Nenhuma máquina em alerta encontrada."
          />
        )}
      </TabsContent>
    </Tabs>
  )
}

function TableCellViewer({ item, sensores, sensorError = "", onViewAlerts }) {
  return (
    <MachineDetailsDrawer
      item={item}
      sensores={sensores}
      sensorError={sensorError}
      onViewAlerts={onViewAlerts}
      trigger={(
        <Button
          variant="ghost"
          className="h-auto w-fit justify-start gap-3 !p-0 text-left text-foreground hover:bg-transparent hover:text-primary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
            {item.imagem ? (
              <img src={item.imagem} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </span>
          <span className="text-sm font-medium hover:underline">{item.nome}</span>
        </Button>
      )}
    />
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
