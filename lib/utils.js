import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function tempoRelativo(isoString) {
  if (!isoString) {
    return "Sem leitura"
  }

  const timestamp = new Date(isoString).getTime()

  if (!Number.isFinite(timestamp)) {
    return "Sem leitura"
  }

  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))

  if (diff < 60) return diff === 0 ? "Agora" : `${diff}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}
