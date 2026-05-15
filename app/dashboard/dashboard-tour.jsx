"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
    title: "Setores e importância",
    description:
      "O radar mostra a integridade por setor. As barras mostram alertas por importância.",
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

const MOBILE_TOUR_STEPS = TOUR_STEPS.map((step) =>
  step.target === "#tour-sidebar"
    ? {
        ...step,
        target: "#tour-sidebar-trigger",
        description:
          "Toque no menu para alternar entre dashboard, máquinas, sensores, alertas e técnicos.",
        side: "bottom",
        align: "start",
      }
    : step
)

export function DashboardTour() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tourInstanceKey, setTourInstanceKey] = useState(0)
  const { isMobile, open: sidebarOpen, setOpen: setSidebarOpen, openMobile, setOpenMobile } = useSidebar()
  const tourSteps = useMemo(() => (isMobile ? MOBILE_TOUR_STEPS : TOUR_STEPS), [isMobile])
  const sidebarStateRef = useRef({
    desktopOpen: true,
    mobileOpen: false,
  })

  function restoreSidebarState() {
    setSidebarOpen(sidebarStateRef.current.desktopOpen)
    setOpenMobile(isMobile ? false : sidebarStateRef.current.mobileOpen)
  }

  useEffect(() => {
    function handleStart() {
      sidebarStateRef.current = {
        desktopOpen: sidebarOpen,
        mobileOpen: openMobile,
      }

      setCurrentStep(0)
      setOpen(false)
      setTourInstanceKey((currentKey) => currentKey + 1)

      if (isMobile) {
        setOpenMobile(false)
        window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      } else {
        setSidebarOpen(true)
      }

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setOpen(true)
        })
      })
    }

    window.addEventListener("orbit:start-tour", handleStart)
    return () => window.removeEventListener("orbit:start-tour", handleStart)
  }, [isMobile, openMobile, setOpenMobile, setSidebarOpen, sidebarOpen])

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
    if (nextStep >= tourSteps.length) {
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

  const scrollOffset = isMobile
    ? { top: 92, bottom: 180, left: 12, right: 12 }
    : { top: 110, bottom: 120, left: 0, right: 0 }
  const collisionPadding = isMobile
    ? { top: 88, right: 12, bottom: 16, left: 12 }
    : 16

  return (
    <Tour
      key={tourInstanceKey}
      open={open}
      onOpenChange={handleOpenChange}
      value={currentStep}
      onValueChange={handleValueChange}
      onComplete={resetTour}
      scrollBehavior="auto"
      scrollOffset={scrollOffset}
    >
      <TourPortal>
        <TourSpotlight />
        <TourSpotlightRing />

        {tourSteps.map((step, index) => {
          const isLastStep = index === tourSteps.length - 1

          return (
            <TourStep
              key={step.target}
              target={step.target}
              side={step.side}
              align={step.align}
              collisionPadding={collisionPadding}
              sideOffset={isMobile ? 8 : undefined}
              className="mt-2 max-h-[calc(100dvh-7rem)] w-[min(360px,calc(100vw-1.5rem))] overflow-y-auto sm:mt-5"
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
