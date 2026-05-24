"use client"

import * as React from "react"
import {
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

function getVisibleRowCount(table) {
  if (typeof table.getFilteredRowModel === "function") {
    return table.getFilteredRowModel().rows.length
  }

  if (typeof table.getPrePaginationRowModel === "function") {
    return table.getPrePaginationRowModel().rows.length
  }

  return table.getRowModel().rows.length
}

export function TablePagination({
  table,
  countLabel,
  itemLabel = "resultado(s)",
  className = "",
  controlsClassName = "",
  showPageSizeSelect = false,
  pageSizeOptions = [10, 20, 30, 40, 50],
  disabled = false,
}) {
  const pageSizeSelectId = React.useId()
  const rowCount = getVisibleRowCount(table)
  const pageCount = Math.max(table.getPageCount(), 1)
  const pageIndex = Math.min(table.getState().pagination?.pageIndex ?? 0, pageCount - 1)

  return (
    <div className={cn("flex items-center justify-between px-0 sm:px-4", className)}>
      <span className="text-sm text-muted-foreground">
        {countLabel ?? `${rowCount} ${itemLabel}`}
      </span>
      <div className={cn("flex items-center justify-end gap-3 sm:gap-8 lg:w-fit", controlsClassName)}>
        {showPageSizeSelect ? (
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor={pageSizeSelectId} className="text-sm font-medium">Por página</Label>
            <Select disabled={disabled} value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
              <SelectTrigger size="sm" className="w-20" id={pageSizeSelectId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => table.setPageIndex(0)} disabled={disabled || !table.getCanPreviousPage()}>
          <ChevronsLeftIcon className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => table.previousPage()} disabled={disabled || !table.getCanPreviousPage()}>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <span className="flex w-fit items-center justify-center text-sm font-medium">
          Pág. {pageIndex + 1} de {pageCount}
        </span>
        <Button variant="outline" size="icon" className="cursor-pointer size-8" onClick={() => table.nextPage()} disabled={disabled || !table.getCanNextPage()}>
          <ChevronRightIcon className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="cursor-pointer hidden size-8 lg:flex" onClick={() => table.setPageIndex(pageCount - 1)} disabled={disabled || !table.getCanNextPage()}>
          <ChevronsRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
