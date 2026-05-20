"use client"

import * as React from "react"

import { useAlertas } from "@/components/context/alertas-context"
import { useMaquinas } from "@/components/context/maquinas-context"
import { useSensores } from "@/components/context/sensores-context"
import { useTecnicos } from "@/components/context/tecnicos-context"

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function useDashboardMetricsLoading(localLoading = false) {
  const { status: maquinasStatus } = useMaquinas()
  const { status: sensoresStatus } = useSensores()
  const { status: alertasStatus } = useAlertas()
  const { status: tecnicosStatus } = useTecnicos()

  return (
    Boolean(localLoading) ||
    maquinasStatus === "loading" ||
    sensoresStatus === "loading" ||
    alertasStatus === "loading" ||
    tecnicosStatus === "loading"
  )
}

/* Atualiza o valor animado aos poucos */
export function useAnimatedNumber(target, { duration = 1400, decimals = 0 } = {}) {
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    const numericTarget = toNumber(target)

    if (typeof window === "undefined") {
      setValue(numericTarget)
      return
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion || numericTarget === 0) {
      setValue(numericTarget)
      return
    }

    let frameId = 0
    let startTime = 0

    function animate(timestamp) {
      if (!startTime) {
        startTime = timestamp
      }

      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextValue = numericTarget * easedProgress

      setValue(decimals > 0 ? Number(nextValue.toFixed(decimals)) : Math.round(nextValue))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      } else {
        setValue(numericTarget)
      }
    }

    setValue(0)
    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [target, duration, decimals])

  return value
}
/* Componente que exibe o valor animado */
export function AnimatedMetric({ value, suffix = "", decimals = 0, duration = 900 }) {
  const animatedValue = useAnimatedNumber(value, { decimals, duration })
  const formattedValue = decimals > 0 ? animatedValue.toFixed(decimals) : animatedValue

  return `${formattedValue}${suffix}`
}
/* Componente que decide o que exibir */
export function MetricValue({ value, loading, suffix = "", decimals = 0, duration = 1400, className = "" }) {
  if (loading) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block h-9 w-20 animate-pulse rounded-md bg-muted align-middle ${className}`}
      />
    )
  }

  return <AnimatedMetric value={value} suffix={suffix} decimals={decimals} duration={duration} />
}
