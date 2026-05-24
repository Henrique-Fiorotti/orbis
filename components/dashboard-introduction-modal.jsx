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
        className="grid max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none! overflow-y-auto rounded-2xl border-0 bg-[#111316] p-0 text-white shadow-2xl ring-0 sm:w-[min(1120px,calc(100vw-2rem))] md:grid-cols-[0.92fr_1.08fr] md:overflow-hidden"
      >
        <div className="flex min-h-[340px] flex-col justify-center gap-8 px-6 py-8 sm:px-10 md:min-h-[612px] md:px-12">
          <div className="space-y-3">
            <DialogTitle className="text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl">
              Bem-vindo ao Orbis
            </DialogTitle>
            <DialogDescription className="max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
              Comece a acompanhar máquinas, sensores e alertas em tempo real no seu dashboard.
            </DialogDescription>
          </div>

          <p className="max-w-md text-xs leading-relaxed text-slate-400 sm:text-sm">
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
              className="h-11 w-full cursor-pointer rounded-lg border-slate-700 bg-transparent px-6 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white sm:w-fit"
              onClick={handleContinue}
            >
              Ir direto para o dashboard
            </Button>
          </div>
        </div>

        <div className="relative min-h-[260px] overflow-hidden bg-black md:min-h-[612px]">
          <video
            className="h-full min-h-[260px] w-full object-cover md:min-h-[612px] object-right"
            src={INTRODUCTION_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
          />
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex size-10 cursor-pointer items-center justify-center rounded-xl bg-slate-900/85 text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
