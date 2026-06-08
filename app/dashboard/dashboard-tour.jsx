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

const ADMIN_TOUR_STEPS = [
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
    title: "Integridade e status",
    description:
      "O gráfico acompanha a integridade média da frota. A rosquinha mostra a condição atual das máquinas.",
    side: "top",
    align: "center",
  },
  {
    target: "#tour-charts-secondary",
    title: "Setores e status",
    description:
      "O radar mostra a integridade por setor. As barras mostram o histórico de status das máquinas.",
    side: "top",
    align: "center",
  },
]

const TECHNICIAN_TOUR_STEPS = [
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
      "Use o menu para alternar entre alertas, máquinas, sensores e demais áreas liberadas para o técnico.",
    side: "right",
    align: "start",
  },
  {
    target: "#tour-technician-overview",
    title: "Painel técnico",
    description:
      "Este cabeçalho mostra o contexto operacional e o botão para atualizar alertas, máquinas e sensores.",
    side: "bottom",
    align: "start",
  },
  {
    target: "#tour-technician-metrics",
    title: "Indicadores do plantão",
    description:
      "Acompanhe atendimentos em andamento, chamados pendentes, resolvidos hoje e alertas críticos.",
    side: "bottom",
    align: "center",
  },
  {
    target: "#tour-technician-priority",
    title: "Prioridade agora",
    description:
      "Os alertas abertos aparecem ordenados por severidade e recência para orientar o próximo atendimento.",
    side: "top",
    align: "center",
  },
  {
    target: "#tour-technician-active",
    title: "Meus alertas",
    description:
      "Aqui ficam os chamados já assumidos pelo técnico para continuar o acompanhamento.",
    side: "top",
    align: "start",
  },
  {
    target: "#tour-technician-completed",
    title: "Atendimentos concluídos",
    description:
      "Consulte o histórico de alertas resolvidos por você e abra os detalhes quando precisar revisar um atendimento.",
    side: "top",
    align: "start",
  },
  {
    target: "#tour-technician-operation",
    title: "Sinais da operação",
    description:
      "Use este resumo para conferir rapidamente máquinas cadastradas e sensores offline.",
    side: "top",
    align: "start",
  },
  {
    target: "#tour-technician-machines",
    title: "Máquinas sob atenção",
    description:
      "Veja equipamentos com alertas ativos ou em atendimento e abra o contexto filtrado quando necessário.",
    side: "top",
    align: "center",
  },
  {
    target: "#tour-technician-shortcuts",
    title: "Atalhos rápidos",
    description:
      "Acesse direto os alertas em aberto, máquinas e sensores para agir sem voltar pelo menu.",
    side: "top",
    align: "center",
  },
]

const TOUR_STEPS_BY_VARIANT = {
  admin: ADMIN_TOUR_STEPS,
  tecnico: TECHNICIAN_TOUR_STEPS,
}

function getMobileTourSteps(steps) {
  return steps.map((step) =>
    step.target === "#tour-sidebar"
      ? {
          ...step,
          target: "#tour-sidebar-trigger",
          description:
            "Toque no menu para alternar entre as áreas liberadas no dashboard.",
          side: "bottom",
          align: "start",
        }
      : step
  )
}

export function DashboardTour({ variant = "admin" }) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tourInstanceKey, setTourInstanceKey] = useState(0)
  const { isMobile, open: sidebarOpen, setOpen: setSidebarOpen, openMobile, setOpenMobile } = useSidebar()
  const baseTourSteps = TOUR_STEPS_BY_VARIANT[variant] ?? ADMIN_TOUR_STEPS
  const tourSteps = useMemo(
    () => (isMobile ? getMobileTourSteps(baseTourSteps) : baseTourSteps),
    [baseTourSteps, isMobile]
  )
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
