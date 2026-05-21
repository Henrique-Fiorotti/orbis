import { DashboardHeaderSkeleton, DashboardPageSkeleton } from "@/components/dashboard-skeletons"

export default function Loading() {
  return (
    <div className="scrollbar-none flex h-dvh max-w-full flex-col overflow-hidden bg-background">
      <DashboardHeaderSkeleton />
      <div className="scrollbar-none flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardPageSkeleton />
      </div>
    </div>
  )
}
