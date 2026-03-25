import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import data from "./data.json"
import { ChartPieDonut } from "@/components/ui/chart-pie-donut"
import { ChartBarStacked } from "@/components/ui/chart-bar-stacked"
import { ChartRadarDots } from "@/components/ui/chart-radar-dots"

export default function Page() {
  return (
    <>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              
              <div className="flex">
                <div className="w-4/6 px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <ChartPieDonut />
                
              </div>
              <div className="flex w-full px-4 lg:px-6">
                <ChartRadarDots />
                <ChartBarStacked />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
        </>
  );
}
