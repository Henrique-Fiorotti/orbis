import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Converte uma data ISO 8601 para texto relativo em português.
 * Ex: "2026-03-24T10:12:00Z" → "5min atrás"
 * Extraído de: maquinas/page.jsx, alertas/page.jsx, sensores/page.jsx, data-table.jsx
 */
export function tempoRelativo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}