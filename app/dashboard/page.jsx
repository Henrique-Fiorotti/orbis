// app/dashboard/page.jsx
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardChartsProvider } from "@/components/context/dashboard-charts-context"
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
      <SiteHeader tourId="tour-header" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">



            <DashboardChartsProvider>

              {/* id adicionado */}
              <div id="tour-section-cards">
                <SectionCards />
              </div>

              {/* id adicionado */}
              <div id="tour-charts-main" className="flex min-w-0 flex-col gap-4 lg:gap-6 xl:flex-row xl:gap-0">
                <div className="w-full min-w-0 px-4 lg:px-6 xl:w-4/6">
                  <ChartAreaInteractive />
                </div>
                <ChartPieDonut />
              </div>

              {/* id adicionado */}
              <div
                id="tour-charts-secondary"
                className="flex w-full flex-col gap-4 px-4 lg:gap-6 lg:px-6 xl:flex-row"
              >
                <ChartRadarDots />
                <ChartBarStacked />
              </div>

              {/* id adicionado */}
              <div id="tour-data-table">
                <DataTable />
              </div>
            </DashboardChartsProvider>

          </div>
        </div>
      </div>

      {/* tour renderizado fora do fluxo */}
      <DashboardTour />
    </>
  )
}
