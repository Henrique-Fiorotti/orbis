// app/dashboard/page.jsx
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { ChartPieDonut } from "@/components/ui/chart-pie-donut"
import { ChartBarStacked } from "@/components/ui/chart-bar-stacked"
import { ChartRadarDots } from "@/components/ui/chart-radar-dots"
import { DashboardTour } from "./dashboard-tour"

export default function Page() {
  return (
    <>
      {/* ↓ ID adicionado */}
      <div id="tour-header">
        <SiteHeader />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

            {/* ↓ ID adicionado */}
            <div id="tour-section-cards">
              <SectionCards />
            </div>

            {/* ↓ ID adicionado */}
            <div id="tour-charts-main" className="flex">
              <div className="w-4/6 px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <ChartPieDonut />
            </div>

            {/* ↓ ID adicionado */}
            <div
              id="tour-charts-secondary"
              className="flex w-full flex-col gap-4 px-4 lg:gap-6 lg:px-6 xl:flex-row"
            >
              <ChartRadarDots />
              <ChartBarStacked />
            </div>

            {/* ↓ ID adicionado */}
            <div id="tour-data-table">
              <DataTable />
            </div>

          </div>
        </div>
      </div>

      {/* ↓ Tour renderizado fora do fluxo — Client Component */}
      <DashboardTour />
    </>
  )
}
