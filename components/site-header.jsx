import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header
      className="flex h-[90px] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-auto" />
        <div className="">
          <h1 className="text-gray-500! text-base text-[13pt]! font-medium m-0!">Dashboard Orbis</h1>
          <h2>Bom dia, Administrador!</h2>
        </div>
      </div>
    </header>
  );
}
