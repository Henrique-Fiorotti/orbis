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
    title: "Cabeçalho do Dashboard",
    description:
      "Aqui ficam os controles principais: expandir a sidebar, notificações, alternar o tema e iniciar este tour a qualquer momento.",
    side: "bottom",
    align: "start",
  },
  {
    target: "#tour-sidebar",
    title: "Sidebar de Navegação",
    description:
      "Aqui fica a navegação principal da plataforma. Use a sidebar para alternar rapidamente entre dashboard, máquinas, sensores, alertas e técnicos.",
    side: "right",
    align: "start",
  },
  {
    target: "#tour-section-cards",
    title: "Métricas Gerais",
    description:
      "Cards com os indicadores mais críticos da ForjaTech: máquinas ativas, alertas do dia, sensores online e integridade média do parque.",
    side: "bottom",
    align: "center",
  },
  {
    target: "#tour-charts-main",
    title: "Tendência de Alertas e Distribuição",
    description:
      "O gráfico de área mostra a evolução dos alertas ao longo do tempo. O gráfico de rosca exibe a distribuição de status das máquinas no dia.",
    side: "top",
    align: "center",
  },
  {
    target: "#tour-charts-secondary",
    title: "Radar e Histórico por Categoria",
    description:
      "O radar compara múltiplas dimensões de desempenho das máquinas. O gráfico de barras empilhadas detalha alertas por tipo ao longo dos meses.",
    side: "top",
    align: "center",
  },
  {
    target: "#tour-data-table",
    title: "Tabela de Máquinas",
    description:
      "Lista completa com status, integridade e último sinal de cada equipamento. Clique no nome de uma máquina para ver os detalhes e leituras dos sensores.",
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
    if (nextStep >= TOUR_STEPS.length - 1) {
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
            >
              <TourArrow />
              <TourClose onClick={resetTour} />

              <TourHeader>
                <TourTitle>{step.title}</TourTitle>
                <TourDescription>{step.description}</TourDescription>
              </TourHeader>

              <TourFooter>
                <TourStepCounter />
                <div className="ml-auto flex gap-2">
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
