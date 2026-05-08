"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.onClick ? (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <button
                    type="button"
                    onClick={item.onClick}
                    aria-label={item.title}
                    className={cn(
                      "w-full bg-transparent no-underline! text-black dark:text-white",
                      item.style
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </button>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a
                    className={cn("no-underline! text-black dark:text-white", item.style)}
                    href={item.url}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
