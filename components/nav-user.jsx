"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { updateUserActiveStatus } from "@/lib/user-status"
import { EllipsisVerticalIcon, CircleUserRoundIcon, LogOutIcon } from "lucide-react"

export function NavUser({user, pathname}){
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouter()
  const [logoutPending, setLogoutPending] = useState(false)
  const profileActive = pathname === "/dashboard/perfil"

  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }
  //alterei para não precisar clicar duas vezes para sair, uma para fechar o menu e outra para deslogar
async function handleLogout() {
  if (logoutPending) {
    return
  }

  setLogoutPending(true)
  closeMobileSidebar()
  const session = getAuthSession()

  if (session?.accessToken) {
    await updateUserActiveStatus(session.accessToken, session.usuario, false).catch(() => {})
  }

  clearAuthSession()
  router.replace("/")
  router.refresh()
}

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="xl"
              tooltip={user.name}
              isActive={profileActive}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:bg-gray-200 dark:data-[state=open]:bg-gray-700">
              <Avatar className="size-13 rounded-lg group-data-[collapsible=icon]:size-4">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">OA</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} /> 
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/dashboard/perfil" onClick={closeMobileSidebar} aria-current={profileActive ? "page" : undefined}>
                <DropdownMenuItem className={"cursor-pointer"}>
                  <CircleUserRoundIcon />
                  Perfil
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem className={"cursor-pointer"} disabled={logoutPending} onClick={handleLogout}>
                  <LogOutIcon />
                  Sair
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent
                side={isMobile ? "top" : "right"}
                sideOffset={8}
                className="max-w-48 border border-border/60 bg-popover/95 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-muted-foreground shadow-md"
              >
                Ao sair, será necessário realizar o login novamente.
              </TooltipContent>
            </Tooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
