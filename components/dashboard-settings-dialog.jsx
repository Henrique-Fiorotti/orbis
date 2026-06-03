"use client"

import * as React from "react"
import { useTheme } from "@/components/theme-provider"
import Lenis from "lenis"
import {
  BotIcon,
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
  const { preferences, setTextScale, setSmoothScrollEnabled, setOrbButtonVisible, resetPreferences } =
    useDashboardPreferences()
  const [mounted, setMounted] = React.useState(false)
  const scrollRef = React.useRef(null)
  const contentRef = React.useRef(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open || !preferences.smoothScrollEnabled) {
      return
    }

    let rafId = 0
    let lenis = null
    let cancelled = false

    const startLenis = () => {
      const wrapper = scrollRef.current
      const content = contentRef.current

      if (cancelled || !wrapper || !content) {
        return
      }

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      if (prefersReducedMotion) {
        return
      }

      lenis = new Lenis({
        wrapper,
        content,
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })
      lenis.resize()

      const raf = (time) => {
        lenis?.raf(time)
        rafId = requestAnimationFrame(raf)
      }

      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(startLenis)
    })

    return () => {
      cancelled = true

      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      lenis?.destroy()
    }
  }, [open, preferences.smoothScrollEnabled])

  function handleResetPreferences() {
    resetPreferences()
    setTheme("system")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(700px,calc(100svh-2rem))] w-[640px] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-[8px]! p-0 sm:max-w-[640px]">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <DialogTitle className="text-lg font-semibold">Configurações</DialogTitle>
          <DialogDescription>
            Preferências salvas neste navegador para ajustar a leitura e o conforto do dashboard.
          </DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div ref={contentRef} className="px-5 py-4">
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
              <SelectTrigger className="h-10 w-full cursor-pointer justify-between rounded-[8px]!" aria-label="Tema do dashboard">
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
                  className="h-10 cursor-pointer rounded-[7px]! border-0 px-2! data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
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
              icon={BotIcon}
              title="Orb IA"
              description="Controle se o atalho flutuante do assistente aparece no canto da tela."
            />
            <Label
              htmlFor="dashboard-orb-button-visible"
              className="flex cursor-pointer items-center justify-between gap-4 rounded-[8px] border px-4 py-3"
            >
              <span className="grid gap-1">
                <span className="text-sm font-medium">Mostrar botao flutuante</span>
                <span className="text-xs font-normal leading-relaxed text-muted-foreground">
                  Quando desativado, o Orb ainda pode ser aberto pela sidebar.
                </span>
              </span>
              <Checkbox
                id="dashboard-orb-button-visible"
                className="cursor-pointer"
                checked={preferences.orbButtonVisible}
                onCheckedChange={(checked) => setOrbButtonVisible(checked === true)}
                aria-label="Mostrar botao flutuante do Orb"
              />
            </Label>
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
                className="cursor-pointer"
                checked={preferences.smoothScrollEnabled}
                onCheckedChange={(checked) => setSmoothScrollEnabled(checked === true)}
                aria-label="Ativar rolagem suave"
              />
            </Label>
          </section>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetPreferences}
            className="cursor-pointer justify-center gap-2"
          >
            <RotateCcwIcon className="size-4" />
            Restaurar padrões
          </Button>
          <DialogClose asChild>
            <Button type="button" className="cursor-pointer justify-center gap-2">
              <CheckIcon className="size-4" />
              Aplicar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
