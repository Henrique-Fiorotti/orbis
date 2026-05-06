"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  CheckIcon,
  MonitorIcon,
  MouseIcon,
  RotateCcwIcon,
  SunIcon,
  TypeIcon,
} from "lucide-react"

import { useDashboardPreferences } from "@/components/context/dashboard-preferences-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const TEXT_SCALE_OPTIONS = [
  { value: "compacta", label: "Compacta", preview: "A-" },
  { value: "padrao", label: "Padrão", preview: "A" },
  { value: "ampliada", label: "Ampliada", preview: "A+" },
]

const THEME_OPTIONS = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
]

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] border bg-muted/40 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>
        <p className="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function DashboardSettingsDialog({ open, onOpenChange }) {
  const { theme, setTheme } = useTheme()
  const { preferences, setTextScale, setSmoothScrollEnabled, resetPreferences } =
    useDashboardPreferences()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  function handleResetPreferences() {
    resetPreferences()
    setTheme("system")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-[8px]! p-0 sm:max-w-[640px]">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="text-lg font-semibold">Configurações</DialogTitle>
          <DialogDescription>
            Preferências salvas neste navegador para ajustar a leitura e o conforto do dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(100svh-11rem)] overflow-y-auto px-5 py-4">
          <section className="grid gap-4 py-2">
            <SectionHeader
              icon={SunIcon}
              title="Aparência"
              description="Escolha como as cores do dashboard devem acompanhar seu ambiente."
            />
            <Select
              value={mounted ? theme || "system" : "system"}
              onValueChange={setTheme}
              disabled={!mounted}
            >
              <SelectTrigger className="h-10 w-full justify-between rounded-[8px]!" aria-label="Tema do dashboard">
                <SelectValue placeholder="Selecionar tema" />
              </SelectTrigger>
              <SelectContent className="rounded-[8px]">
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-[6px]">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <Separator className="my-4" />

          <section className="grid gap-4 py-2">
            <SectionHeader
              icon={TypeIcon}
              title="Leitura"
              description="Ajuste o tamanho geral da interface sem mudar a estrutura do painel."
            />
            <ToggleGroup
              type="single"
              value={preferences.textScale}
              onValueChange={(value) => {
                if (value) {
                  setTextScale(value)
                }
              }}
              className="grid w-full grid-cols-3 rounded-[8px] border bg-muted/30 p-1"
              variant="outline"
              aria-label="Escala de texto do dashboard"
            >
              {TEXT_SCALE_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={`Fonte ${option.label.toLowerCase()}`}
                  className="h-10 rounded-[7px]! border-0 px-2! data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
                >
                  <span className="flex min-w-0 items-center justify-center gap-2">
                    <span className="font-semibold">{option.preview}</span>
                    <span className="hidden truncate text-xs sm:inline">{option.label}</span>
                    {preferences.textScale === option.value ? <CheckIcon className="size-3.5" /> : null}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          <Separator className="my-4" />

          <section className="grid gap-4 py-2">
            <SectionHeader
              icon={MouseIcon}
              title="Movimento"
              description="Controle a rolagem suave usada nas páginas do dashboard."
            />
            <Label
              htmlFor="dashboard-smooth-scroll"
              className="flex cursor-pointer items-center justify-between gap-4 rounded-[8px] border px-4 py-3"
            >
              <span className="grid gap-1">
                <span className="text-sm font-medium">Rolagem suave</span>
                <span className="text-xs font-normal leading-relaxed text-muted-foreground">
                  Desative se preferir uma resposta mais direta ao scroll.
                </span>
              </span>
              <Checkbox
                id="dashboard-smooth-scroll"
                checked={preferences.smoothScrollEnabled}
                onCheckedChange={(checked) => setSmoothScrollEnabled(checked === true)}
                aria-label="Ativar rolagem suave"
              />
            </Label>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetPreferences}
            className="justify-center gap-2"
          >
            <RotateCcwIcon className="size-4" />
            Restaurar padrões
          </Button>
          <DialogClose asChild>
            <Button type="button" className="justify-center gap-2">
              <CheckIcon className="size-4" />
              Aplicar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
