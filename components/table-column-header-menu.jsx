"use client"

import * as React from "react"
import { ArrowUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const FILTER_ALL_VALUE = "__all__"
const SORT_NONE_VALUE = "__none__"

export function TableColumnHeaderMenu({
  column,
  label,
  filterOptions = [],
  sortOptions = [],
}) {
  const sorted = column.getIsSorted()
  const filterValue = column.getFilterValue() ?? FILTER_ALL_VALUE
  const hasActiveFilter = filterValue !== FILTER_ALL_VALUE
  const hasActiveSort = Boolean(sorted)

  function handleFilterChange(value) {
    column.setFilterValue(value === FILTER_ALL_VALUE ? undefined : value)
  }

  function handleSortChange(value) {
    if (value === SORT_NONE_VALUE) {
      column.clearSorting()
      return
    }

    const option = sortOptions.find((item) => item.value === value)
    column.toggleSorting(option?.desc ?? false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "-ml-2 h-8 px-2 text-xs font-medium hover:bg-muted/70",
            (hasActiveFilter || hasActiveSort) && "text-primary"
          )}
        >
          {label}
          <ArrowUpDownIcon className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {sortOptions.length > 0 ? (
          <>
            <DropdownMenuLabel>Ordenar</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sorted || SORT_NONE_VALUE}
              onValueChange={handleSortChange}
            >
              <DropdownMenuRadioItem value={SORT_NONE_VALUE}>Sem ordenacao</DropdownMenuRadioItem>
              {sortOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        ) : null}

        {sortOptions.length > 0 && filterOptions.length > 0 ? <DropdownMenuSeparator /> : null}

        {filterOptions.length > 0 ? (
          <>
            <DropdownMenuLabel>Filtrar</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={filterValue}
              onValueChange={handleFilterChange}
            >
              <DropdownMenuRadioItem value={FILTER_ALL_VALUE}>Todos</DropdownMenuRadioItem>
              {filterOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
