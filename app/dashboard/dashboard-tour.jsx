"use client"

import { useEffect, useRef, useState } from "react"
import {
  Tour,
  TourPortal,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourArrow,
  TourClose,
  TourHeader,
  TourTitle,
  TourDescription,
  TourFooter,
  TourStepCounter,
  TourPrev,
  TourNext,
  TourSkip,
} from "@/components/ui/tour"
import { useSidebar } from "@/components/ui/sidebar"

const TOUR_STEPS = [
  {
    target: "#tour-header",
    title: "Cabeçalho do dashboard",
    description:
      "Aqui ficam os atalhos principais: menu, notificações, tema e tour guiado.",
    side: "bottom",
    align: "start",
  },
  {
    target: "#tour-sidebar",
    title: "Menu de navegação",
    description:
      "Use o menu para alternar entre dashboard, máquinas, sensores, alertas e técnicos.",
    side: "right",
    align: "start",
  },
  {
    target: "#tour-section-cards",
    title: "Métricas gerais",
    description:
      "Resumo rápido de máquinas, alertas, sensores online e integridade média.",
    side: "bottom",
    align: "center",
  },
  {
    target: "#tour-charts-main",
    title: "Alertas e status",
    description:
      "A tendência mostra quando os alertas aumentam. A rosquinha mostra a condição atual das máquinas.",
    side: "top",
    align: "center",
  },
  {
    target: "#tour-charts-secondary",
    title: "Setores e criticidade",
    description:
      "O radar mostra a integridade por setor. As barras mostram alertas por criticidade.",
    side: "top",
    align: "center",
  },
  {
    target: "#tour-data-table",
    title: "Tabela de máquinas",
    description:
      "Lista as máquinas, status, integridade e último sinal. Clique no nome para ver detalhes.",
    side: "top",
    align: "start",
  },
]

export function DashboardTour() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tourInstanceKey, setTourInstanceKey] = useState(0)
  const { open: sidebarOpen, setOpen: setSidebarOpen, openMobile, setOpenMobile } = useSidebar()
  const sidebarStateRef = useRef({
    desktopOpen: true,
    mobileOpen: false,
  })

  function restoreSidebarState() {
    setSidebarOpen(sidebarStateRef.current.desktopOpen)
    setOpenMobile(sidebarStateRef.current.mobileOpen)
  }

  useEffect(() => {
    function handleStart() {
      sidebarStateRef.current = {
        desktopOpen: sidebarOpen,
        mobileOpen: openMobile,
      }

      setSidebarOpen(true)
      setOpenMobile(true)
      setCurrentStep(0)
      setOpen(true)
    }

    window.addEventListener("orbit:start-tour", handleStart)
    return () => window.removeEventListener("orbit:start-tour", handleStart)
  }, [openMobile, setOpenMobile, setSidebarOpen, sidebarOpen])

  function resetTour() {
    restoreSidebarState()
    setOpen(false)
    setCurrentStep(0)
    setTourInstanceKey((currentKey) => currentKey + 1)
  }

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen)

    if (!nextOpen) {
      restoreSidebarState()
      setCurrentStep(0)
    }
  }

  function handleValueChange(nextStep) {
    if (nextStep >= TOUR_STEPS.length) {
      resetTour()
      return
    }

    setCurrentStep(nextStep)
  }

  function handleNextClick(event, isLastStep) {
    if (!isLastStep) {
      return
    }

    event.preventDefault()
    resetTour()
  }

  return (
    <Tour
      key={tourInstanceKey}
      open={open}
      onOpenChange={handleOpenChange}
      value={currentStep}
      onValueChange={handleValueChange}
      onComplete={resetTour}
    >
      <TourPortal>
        <TourSpotlight />
        <TourSpotlightRing />

        {TOUR_STEPS.map((step, index) => {
          const isLastStep = index === TOUR_STEPS.length - 1

          return (
            <TourStep
              key={step.target}
              target={step.target}
              side={step.side}
              align={step.align}
              className="overflow-y-hidden mt-5"
            >
              <TourArrow />
              <TourClose onClick={resetTour} />

              <TourHeader>
                <TourTitle>{step.title}</TourTitle>
                <TourDescription>{step.description}</TourDescription>
              </TourHeader>

              <TourFooter>
                <TourStepCounter />
                <div className="flex flex-wrap justify-end gap-2 sm:ml-auto sm:flex-nowrap">
                  <TourSkip onClick={resetTour} />
                  <TourPrev />
                  <TourNext onClick={(event) => handleNextClick(event, isLastStep)}>
                    {isLastStep ? "Finalizar" : undefined}
                  </TourNext>
                </div>
              </TourFooter>
            </TourStep>
          )
        })}
      </TourPortal>
    </Tour>
  )
}
