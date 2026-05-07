import { DashboardHeaderSkeleton, DashboardPageSkeleton } from "@/components/dashboard-skeletons"

export default function Loading() {
  return (
    <>
      <DashboardHeaderSkeleton />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardPageSkeleton />
      </div>
    </>
  )
}
