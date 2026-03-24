"use client"

// =============================================================
// INTEGRAÇÃO COM A API — quando a API estiver pronta:
//
// Buscar de: GET /maquinas?page=1&limit=20
// Headers: Authorization: Bearer <token>
//
// Substituir o prop "data" em page.jsx por:
// const [maquinas, setMaquinas] = useState([])
// useEffect(() => {
//   fetch(`${process.env.NEXT_PUBLIC_API_URL}/maquinas`, {
//     headers: { Authorization: `Bearer ${token}` }
//   })
//     .then(res => res.json())
//     .then(data => setMaquinas(data.dados))
// }, [])
// E passar: <DataTable data={maquinas} />
//
// Formato esperado de cada item (vem do data.json por enquanto):
// { id, nome, setor, tipo, criticidade, integridade,
//   scoreEstabilidade, status, ultimaLeituraEm, sensores }
// =============================================================

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  GripVerticalIcon,
  CircleCheckIcon,
  AlertTriangleIcon,
  EllipsisVerticalIcon,
  Columns3Icon,
  ChevronDownIcon,
  PlusIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  TrendingUpIcon,
} from "lucide-react"

// Schema Zod no formato do Orbit
export const schema = z.object({
  id: z.number(),
  nome: z.string(),
  setor: z.string(),
  tipo: z.string(),
  criticidade: z.enum(["BAIXA", "MEDIA", "ALTA"]),
  integridade: z.number(),
  scoreEstabilidade: z.number(),
  status: z.enum(["OK", "ALERTA"]),
  ultimaLeituraEm: z.string(),
  sensores: z.number(),
})

// Formata "há X minutos" a partir do timestamp
function tempoRelativo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  return `${Math.floor(diff / 3600)}h atrás`
}

// Badge de criticidade
function CriticidadeBadge({ value }) {
  const styles = {
    ALTA: "bg-red-100 text-red-700 border-red-200",
    MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200",
    BAIXA: "bg-green-100 text-green-700 border-green-200",
  }
  return (
    <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </Badge>
  )
}

// Schema para criação (omitindo campos automáticos como ID e data)
const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  setor: z.string().min(1, "Setor é obrigatório"),
  tipo: z.string().min(1, "Tipo da máquina é obrigatório"),
  criticidade: z.enum(["BAIXA", "MEDIA", "ALTA"]),
  status: z.enum(["OK", "ALERTA"]),
  integridade: z.coerce.number().min(0).max(100),
  sensores: z.coerce.number().min(0),
})

// Badge de status OK / ALERTA
function StatusBadge({ value }) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? (
        <CircleCheckIcon className="fill-[#5E17EB]! dark:fill-[#5E17EB]!" />
      ) : (
        <AlertTriangleIcon className="text-red-500" />
      )}
      {value}
    </Badge>
  )
}

function DragHandle({ id }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:bg-transparent">
      <GripVerticalIcon className="size-3 text-muted-foreground" />
      <span className="sr-only">Reordenar</span>
    </Button>
  )
}

const columns = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha" />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome",
    header: "Máquina",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "setor",
    header: "Setor",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.original.setor}</span>
    ),
  },
  {
    accessorKey: "criticidade",
    header: "Criticidade",
    cell: ({ row }) => <CriticidadeBadge value={row.original.criticidade} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge value={row.original.status} />,
  },
  {
    accessorKey: "integridade",
    header: () => <div className="w-full text-right">Integridade</div>,
    cell: ({ row }) => (
      <span className={`block text-right font-medium ${row.original.integridade < 50 ? "text-red-500" :
        row.original.integridade < 75 ? "text-yellow-500" : "text-green-600"
        }`}>
        {row.original.integridade}%
      </span>
    ),
  },
  {
    accessorKey: "ultimaLeituraEm",
    header: "Último sinal",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {tempoRelativo(row.original.ultimaLeituraEm)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
            size="icon">
            <EllipsisVerticalIcon />
            <span className="sr-only">Abrir menu</span>
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

function DraggableRow({ row }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({ data: initialData }) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState([])
  const [sorting, setSorting] = React.useState([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo(() => data?.map(({ id }) => id) || [], [data])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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
  });

  function handleDragEnd(event) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Máquinas</TabsTrigger>
          <TabsTrigger value="alertas">
            Em Alerta <Badge variant="secondary">{data.filter(m => m.status === "ALERTA").length}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon data-icon="inline-start" />
                Colunas
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {table
                .getAllColumns()
                .filter((column) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
                )
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Nova Máquina
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Máquina</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para cadastrar uma nova máquina no sistema.
                </DialogDescription>
              </DialogHeader>

              {/* Conteúdo do seu formulário aqui */}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nome</Label>
                  <Input id="name" className="col-span-3" />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Nenhuma máquina encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} máquina(s) selecionada(s).
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}>
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <ChevronsLeftIcon />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeftIcon />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRightIcon />
              </Button>
              <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="alertas" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-sm">
          {/* TODO: tabela filtrada só com máquinas em ALERTA */}
          Listagem de máquinas em alerta — em desenvolvimento
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Mock de leituras para o drawer — substituir por GET /leituras/:sensorId?periodo=24h
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
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {item.nome}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-[80%]! max-w-none!">
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.nome}</DrawerTitle>
          <DrawerDescription>
            {item.setor} — {item.tipo}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={leiturasMock}
                  margin={{ left: 0, right: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area dataKey="vibracao" type="natural" fill="var(--color-vibracao)" fillOpacity={0.4} stroke="var(--color-vibracao)" stackId="a" />
                  <Area dataKey="temperatura" type="natural" fill="var(--color-temperatura)" fillOpacity={0.6} stroke="var(--color-temperatura)" stackId="a" />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Integridade: {item.integridade}% · Estabilidade: {item.scoreEstabilidade}%
                  <TrendingUpIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Últimas leituras das últimas 6 horas. Dados reais virão de{" "}
                  <code className="text-xs">GET /leituras/{"{sensorId}"}?periodo=24h</code>
                </div>
              </div>
              <Separator />
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Criticidade</Label>
              <span className="font-medium">{item.criticidade}</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Status</Label>
              <StatusBadge value={item.status} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Integridade</Label>
              <span className="font-medium">{item.integridade}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Sensores vinculados</Label>
              <span className="font-medium">{item.sensores}</span>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Ver alertas desta máquina</Button>
          <DrawerClose asChild>
            <Button variant="outline">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

  )
}