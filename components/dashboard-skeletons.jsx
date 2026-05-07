import { Card, CardAction, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function LoadingRegion({ label, className, children }) {
  return (
    <div role="status" aria-label={label} className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="contents">{children}</div>
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r bg-sidebar p-3 md:flex md:flex-col">
      <div className="flex h-12 items-center px-2">
        <Skeleton className="size-9 rounded-md" />
      </div>
      <div className="mt-4 space-y-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-md px-2 py-2">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className={cn("h-4", index === 0 ? "w-28" : "w-24")} />
          </div>
        ))}
      </div>
      <div className="mt-auto space-y-1.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-md px-2 py-2">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-md px-2 py-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>
    </aside>
  )
}

export function DashboardHeaderSkeleton() {
  return (
    <LoadingRegion label="Carregando cabecalho do dashboard">
      <header className="flex h-[90px] shrink-0 items-center gap-2 border-b">
        <div className="flex min-w-0 w-full items-center gap-1 px-3 sm:px-4 lg:gap-2 lg:px-6">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="mx-2 h-8 w-px" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex-1" />
          <div className="flex shrink-0 items-center gap-1">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      </header>
    </LoadingRegion>
  )
}

function MetricCardSkeleton({ highlighted = false }) {
  return (
    <Card
      className={cn(
        "@container/card shadow-xs",
        highlighted ? "border-[#5E17EB]! border-2" : "ring-foreground/10"
      )}
    >
      <CardHeader>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-1 h-8 w-20 @[250px]/card:h-9" />
        <CardAction>
          <Skeleton className="h-6 w-24 rounded-full" />
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-2 bg-transparent">
        <Skeleton className="h-4 w-44 max-w-full" />
        <Skeleton className="h-3.5 w-36 max-w-full" />
      </CardFooter>
    </Card>
  )
}

export function DashboardMetricCardsSkeleton() {
  return (
    <LoadingRegion
      label="Carregando indicadores do dashboard"
      className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <MetricCardSkeleton key={index} highlighted={index === 0} />
      ))}
    </LoadingRegion>
  )
}

function ChartSurfaceSkeleton({ variant = "area", height = "h-[250px]" }) {
  if (variant === "donut") {
    return (
      <div className={cn("flex items-center justify-center", height)}>
        <div className="relative flex size-44 items-center justify-center sm:size-52">
          <Skeleton className="size-full rounded-full" />
          <div className="absolute size-24 rounded-full bg-card sm:size-28" />
        </div>
      </div>
    )
  }

  if (variant === "radar") {
    return (
      <div className={cn("flex items-center justify-center", height)}>
        <div className="relative size-56 max-w-full">
          <Skeleton className="absolute inset-0 rounded-full" />
          <Skeleton className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" />
          <Skeleton className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2" />
          <Skeleton className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80" />
        </div>
      </div>
    )
  }

  if (variant === "bar") {
    return (
      <div className={cn("flex items-end gap-4 px-2 pb-2", height)}>
        {[42, 68, 54, 82, 48, 72].map((value, index) => (
          <div key={index} className="flex flex-1 flex-col justify-end gap-2">
            <Skeleton className="w-full rounded-t-md" style={{ height: `${value}%` }} />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-card px-4 py-4", height)}>
      <div className="absolute inset-x-4 top-6 space-y-9">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-px w-full" />
        ))}
      </div>
      <div className="absolute inset-x-4 bottom-6 flex items-end gap-3">
        {[35, 48, 40, 65, 58, 76, 64, 84, 70, 88].map((value, index) => (
          <Skeleton key={index} className="flex-1 rounded-t-md" style={{ height: `${value}px` }} />
        ))}
      </div>
    </div>
  )
}

export function DashboardChartSkeleton({
  className,
  variant = "area",
  height = "h-[250px]",
  centeredHeader = false,
}) {
  return (
    <LoadingRegion label="Carregando grafico do dashboard" className={className}>
      <Card className="h-full">
        <CardHeader className={cn(centeredHeader && "items-center")}>
          <div className={cn("space-y-2", centeredHeader && "flex flex-col items-center")}>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          {variant === "area" ? (
            <CardAction className="hidden items-center gap-2 md:flex">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="px-4 pt-2">
          <ChartSurfaceSkeleton variant={variant} height={height} />
        </CardContent>
        <CardFooter className="justify-end border-t-0 bg-transparent pt-0">
          <Skeleton className="size-8 rounded-lg" />
        </CardFooter>
      </Card>
    </LoadingRegion>
  )
}

export function DashboardTableSkeleton({ className }) {
  const columnWidths = ["w-8", "w-12", "w-56", "w-36", "w-24", "w-24", "w-32", "w-28", "w-8"]

  return (
    <LoadingRegion label="Carregando tabela do dashboard" className={cn("flex flex-col gap-4", className)}>
      <div className="min-h-[500px] overflow-auto rounded-lg border dark:bg-[#0F172A] dark:border-gray-700!">
        <div className="grid min-w-[900px] grid-cols-[48px_52px_1.8fr_1.2fr_120px_120px_140px_120px_48px] gap-4 border-b bg-muted px-4 py-3">
          {columnWidths.map((width, index) => (
            <Skeleton key={index} className={cn("h-4", width)} />
          ))}
        </div>
        <div className="min-w-[900px] divide-y">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-[48px_52px_1.8fr_1.2fr_120px_120px_140px_120px_48px] items-center gap-4 px-4 py-4"
            >
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="size-4 rounded-sm" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-4">
        <Skeleton className="hidden h-4 w-64 lg:block" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    </LoadingRegion>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <DashboardMetricCardsSkeleton />
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6 xl:flex-row xl:gap-0">
          <div className="w-full min-w-0 px-4 lg:px-6 xl:w-4/6">
            <DashboardChartSkeleton />
          </div>
          <DashboardChartSkeleton
            variant="donut"
            centeredHeader
            className="mx-4 flex w-auto flex-col lg:mx-6 xl:mx-0 xl:mr-6 xl:w-2/6"
          />
        </div>
        <div className="flex w-full flex-col gap-4 px-4 lg:gap-6 lg:px-6 xl:flex-row">
          <DashboardChartSkeleton variant="radar" centeredHeader className="w-full xl:w-1/2" height="h-[280px]" />
          <DashboardChartSkeleton variant="bar" className="w-full xl:w-1/2" height="h-[280px]" />
        </div>
        <div className="px-4 lg:px-6">
          <DashboardTableSkeleton />
        </div>
      </div>
    </div>
  )
}

export function DashboardAuthSkeleton() {
  return (
    <LoadingRegion label="Preparando dashboard" className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <SidebarSkeleton />
        <main className="flex min-w-0 flex-1 flex-col">
          <DashboardHeaderSkeleton />
          <DashboardPageSkeleton />
        </main>
      </div>
    </LoadingRegion>
  )
}

export function ProfilePageSkeleton() {
  return (
    <LoadingRegion label="Carregando perfil" className="flex w-full flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <Skeleton className="h-px w-full" />

      <div className="flex flex-col items-center gap-8 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:gap-10">
        <Skeleton className="size-20 rounded-full sm:size-24 lg:size-30" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-hidden rounded-md bg-muted p-1 sm:w-fit">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="hidden h-8 w-28 rounded-md sm:block" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-full rounded-md" />
              {index < 3 ? <Skeleton className="h-3 w-44" /> : null}
            </div>
          ))}
        </div>
        <div className="flex flex-col-reverse justify-end gap-2 pt-1 sm:flex-row">
          <Skeleton className="h-9 w-full rounded-md sm:w-24" />
          <Skeleton className="h-9 w-full rounded-md sm:w-36" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-36" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  )
}
