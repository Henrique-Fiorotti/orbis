import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({ children }) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  )
}