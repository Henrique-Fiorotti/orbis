"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useMaquinas } from "./context/maquinas-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GripVerticalIcon, CircleCheckIcon, AlertTriangleIcon, EllipsisVerticalIcon, Columns3Icon, ChevronDownIcon, PlusIcon, ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon, TrendingUpIcon, ArrowRightIcon } from "lucide-react"
import { cn, tempoRelativo } from "@/lib/utils"

function CriticidadeBadge({ value }) {
  const styles = { ALTA: "w-[55px] bg-red-100 text-red-700 dark:bg-transparent! dark:text-white", MEDIA: "w-[55px] bg-yellow-100 text-yellow-700 dark:text-white dark:bg-transparent!", BAIXA: "w-[55px] bg-green-100 text-green-700 dark:bg-transparent! dark:text-white" }
  return <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</Badge>
}

function StatusBadge({ value }) {
  return (
    <Badge variant="outline" className="w-[55px] px-1.5 text-muted-foreground">
      {value === "OK" ? <CircleCheckIcon className="fill-[#5E17EB]!" /> : <AlertTriangleIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function IntegridadeBar({ value }) {
  const cor = value < 50 ? "bg-red-500" : value < 75 ? "bg-yellow-400" : "bg-green-500"
  const textCor = value < 50 ? "text-red-500" : value < 75 ? "text-yellow-500" : "text-green-600"
  return (
    <div className="flex flex-row-reverse items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-sm font-medium w-9 text-right tabular-nums ${textCor}`}>{value}%</span>
    </div>
  )
}

function DragHandle({ id }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="size-7 text-muted-foreground hover:bg-transparent">
      <GripVerticalIcon className="size-3" /><span className="sr-only">Reordenar</span>
    </Button>
  )
}

const TABLE_COLUMNS = [
  { id: "drag", header: () => null, cell: ({ row }) => <DragHandle id={row.original.id} /> },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)} aria-label="Selecionar todos" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox checked={row.getIsSelected()} onCheckedChange={v => row.toggleSelected(!!v)} aria-label="Selecionar linha" />
      </div>
    ),
    enableSorting: false, enableHiding: false,
  },
  { accessorKey: "nome", header: "Máquina", cell: ({ row }) => <TableCellViewer item={row.original} />, enableHiding: false },
  { accessorKey: "setor", header: "Setor", cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.setor}</span> },
  { accessorKey: "criticidade", header: "Importância", cell: ({ row }) => <CriticidadeBadge value={row.original.criticidade} /> },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
  { accessorKey: "integridade", header: () => <div>Integridade</div>, cell: ({ row }) => <IntegridadeBar value={row.original.integridade} /> },
  { accessorKey: "ultimaLeituraEm", header: "Último sinal", cell: ({ row }) => <span className="text-muted-foreground text-sm">{tempoRelativo(row.original.ultimaLeituraEm)}</span> },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex size-8 text-muted-foreground data-[state=open]:bg-muted" size="icon">
            <EllipsisVerticalIcon /><span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
          <DropdownMenuItem>Ver alertas</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Remover</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// Tabela interna reutilizável (recebe data por prop)
function MaquinasTable({ data }) {
  const [orderedData, setOrderedData] = React.useState(data)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState([])
  const [sorting, setSorting] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const sortableId = React.useId()
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))

  React.useEffect(() => { setOrderedData(data) }, [data])

  const dataIds = React.useMemo(() => orderedData?.map(({ id }) => id) || [], [orderedData])

  const table = useReactTable({
    data: orderedData, columns: TABLE_COLUMNS,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    getRowId: row => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection, onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters, onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(), getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <>
      <div className="min-h-[500px] overflow-hidden rounded-lg border dark:bg-[#0F172A] dark:border-gray-700!">
        <DndContext collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]}
          onDragEnd={({ active, over }) => {
            if (active && over && active.id !== over.id)
              setOrderedData(d => arrayMove(d, dataIds.indexOf(active.id), dataIds.indexOf(over.id)))
          }}
          sensors={sensors} id={sortableId}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => <TableHead key={h.id} colSpan={h.colSpan}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="relative z-0">
                      {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                    </TableRow>
                  ))}
                </SortableContext>
              ) : (
                <TableRow><TableCell colSpan={TABLE_COLUMNS.length} className="h-24 text-center text-muted-foreground">Nenhuma máquina encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} máquina(s) selecionada(s).
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-pp" className="text-sm font-medium">Por página</Label>
            <Select value={`${table.getState().pagination.pageSize}`} onValueChange={v => table.setPageSize(Number(v))}>
              <SelectTrigger size="sm" className="w-20" id="rows-pp"><SelectValue /></SelectTrigger>
              <SelectContent side="top"><SelectGroup>{[10, 20, 30, 40, 50].map(ps => <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeftIcon /></Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeftIcon /></Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRightIcon /></Button>
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRightIcon /></Button>
          </div>
        </div>
      </div>
    </>
  )
}

// Componente principal — não recebe mais "data" como prop, usa o contexto diretamente
export function DataTable() {
  const router = useRouter()
  const { maquinas } = useMaquinas()
  const emAlerta = React.useMemo(() => maquinas.filter(m => m.status === "ALERTA"), [maquinas])

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className=" rounded-[8px]! flex items-center justify-between px-4 lg:px-6">
        <TabsList className="rounded-[8px]! hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full! **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger className="rounded-[8px]! dark:border-gray-600!" value="outline">Máquinas</TabsTrigger>
          <TabsTrigger className="rounded-[8px]! dark:border-gray-600!" value="alertas">
            Em Alerta
            {emAlerta.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-red-100! text-red-700! border-red-200!">{emAlerta.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Columns3Icon data-icon="inline-start" />Colunas<ChevronDownIcon data-icon="inline-end" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs text-muted-foreground" onClick={() => router.push("/dashboard/maquinas")}>Gerenciar colunas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/maquinas?action=new")}>
            <PlusIcon /><span className="hidden lg:inline">Nova máquina</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/maquinas")}>
            <span className="hidden lg:inline">Ver todas</span>
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Aba: todas as máquinas — vem do contexto em tempo real */}
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <MaquinasTable data={maquinas} />
      </TabsContent>

      {/* Aba: somente máquinas com status ALERTA */}
      <TabsContent value="alertas" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        {emAlerta.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 rounded-lg border border-dashed text-muted-foreground">
            <CircleCheckIcon className="size-8 text-green-500" />
            <p className="text-sm font-medium">Nenhuma máquina em alerta no momento.</p>
            <p className="text-xs">Todas as máquinas estão operando normalmente.</p>
          </div>
        ) : (
          <MaquinasTable className="min-h-[500px]" data={emAlerta} />
        )}
      </TabsContent>
    </Tabs>
  )
}

const leiturasMock = [
  { month: "19h", temperatura: 62, vibracao: 0.4 },
  { month: "20h", temperatura: 65, vibracao: 0.5 },
  { month: "21h", temperatura: 68, vibracao: 0.6 },
  { month: "22h", temperatura: 71, vibracao: 0.7 },
  { month: "23h", temperatura: 69, vibracao: 0.5 },
  { month: "00h", temperatura: 73, vibracao: 0.8 },
]
const chartConfig = {
  temperatura: { label: "Temperatura (°C)", color: "var(--primary)" },
  vibracao: { label: "Vibração", color: "var(--chart-3)" },
}

function TableCellViewer({ item }) {
  const isMobile = useIsMobile()
  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">{item.nome}</Button>
      </DrawerTrigger>
      <DrawerContent className="w-[80%]! max-w-none!">
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.nome}</DrawerTitle>
          <DrawerDescription>{item.setor} — {item.tipo}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart accessibilityLayer data={leiturasMock} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area dataKey="vibracao" type="natural" fill="var(--color-vibracao)" fillOpacity={0.4} stroke="var(--color-vibracao)" stackId="a" />
                  <Area dataKey="temperatura" type="natural" fill="var(--color-temperatura)" fillOpacity={0.6} stroke="var(--color-temperatura)" stackId="a" />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="flex gap-2 leading-none font-medium">
                Integridade: {item.integridade}% · Estabilidade: {item.scoreEstabilidade}%
                <TrendingUpIcon className="size-4" />
              </div>
              <Separator />
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1"><Label>Criticidade</Label><CriticidadeBadge value={item.criticidade} /></div>
            <div className="flex flex-col gap-1"><Label>Status</Label><StatusBadge value={item.status} /></div>
            <div className="flex flex-col gap-2 col-span-2"><Label>Integridade</Label><IntegridadeBar value={item.integridade} /></div>
            <div className="flex flex-col gap-1"><Label>Sensores vinculados</Label><span className="font-medium">{item.sensores}</span></div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Ver alertas desta máquina</Button>
          <DrawerClose asChild><Button variant="outline">Fechar</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}