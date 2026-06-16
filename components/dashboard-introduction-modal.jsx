"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { getAuthSessionUser } from "@/lib/auth-session"
import {
  DASHBOARD_INTRODUCTION_MODAL_OPEN_EVENT,
  INTRODUCTION_VIDEO_SRC,
  getIntroductionSeenStorageKey,
} from "@/lib/introduction-modal.mjs"

export function DashboardIntroductionModal() {
  const [open, setOpen] = React.useState(false)
  const [storageKey, setStorageKey] = React.useState("")

  React.useEffect(() => {
    const user = getAuthSessionUser()
    const nextStorageKey = getIntroductionSeenStorageKey(user)
    setStorageKey(nextStorageKey)

    try {
      if (window.localStorage.getItem(nextStorageKey) !== "1") {
        setOpen(true)
      }
    } catch {
      setOpen(true)
    }
  }, [])

  React.useEffect(() => {
    function handleOpenIntroduction() {
      setOpen(true)
    }

    window.addEventListener(DASHBOARD_INTRODUCTION_MODAL_OPEN_EVENT, handleOpenIntroduction)

    return () => {
      window.removeEventListener(DASHBOARD_INTRODUCTION_MODAL_OPEN_EVENT, handleOpenIntroduction)
    }
  }, [])

  function markAsSeen() {
    if (!storageKey) {
      return
    }

    try {
      window.localStorage.setItem(storageKey, "1")
    } catch {}
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      markAsSeen()
    }

    setOpen(nextOpen)
  }

  function handleContinue() {
    markAsSeen()
    setOpen(false)
  }

  function handleStartTour() {
    markAsSeen()
    setOpen(false)

    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("orbit:start-tour"))
    }, 150)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none! overflow-y-auto rounded-2xl border border-black/[0.08] bg-white p-0 text-zinc-950 shadow-2xl ring-0 sm:w-[min(1120px,calc(100vw-2rem))] md:grid-cols-[0.92fr_1.08fr] md:overflow-hidden dark:border-white/[0.08] dark:bg-[#111316] dark:text-white"
      >
        <div className="flex min-h-[340px] flex-col justify-center gap-8 px-6 py-8 sm:px-10 md:min-h-[612px] md:px-12">
          <div className="space-y-3">
            <DialogTitle className="text-3xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-4xl dark:text-white">
              Bem-vindo ao Orbis
            </DialogTitle>
            <DialogDescription className="max-w-md text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-slate-300">
              Comece a acompanhar máquinas, sensores e alertas em tempo real no seu dashboard.
            </DialogDescription>
          </div>

          <p className="max-w-md text-xs leading-relaxed text-zinc-500 sm:text-sm dark:text-slate-400">
            Depois disso, você pode rever a introdução quando quiser pela seção Ajuda na sidebar.
          </p>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="h-11 w-full cursor-pointer rounded-lg bg-[#5E17EB] px-6 text-sm font-semibold text-white hover:bg-[#4f12ca] sm:w-fit"
              onClick={handleStartTour}
            >
              Começar o tour
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full cursor-pointer rounded-lg border-zinc-200 bg-transparent px-6 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 sm:w-fit dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              onClick={handleContinue}
            >
              Ir direto para o dashboard
            </Button>
          </div>
        </div>

        <div className="relative min-h-[260px] overflow-hidden bg-zinc-100 md:min-h-[612px] dark:bg-black">
          <img
            className="h-full min-h-[260px] w-full object-cover md:min-h-[612px] object-left"
            src={INTRODUCTION_VIDEO_SRC}
            alt="Introdução ao Orbis"
          />
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex size-10 cursor-pointer items-center justify-center rounded-xl bg-white/90 text-zinc-600 shadow-sm transition hover:bg-white hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/40 dark:bg-slate-900/85 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-white/60"
            onClick={handleContinue}
            aria-label="Fechar introdução"
          >
            <XIcon className="size-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
