"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/alertas/data.json"

// =============================================================
// INTEGRAÇÃO COM A API — quando a API estiver pronta:
//
// GET    /alertas               → lista todos os alertas
// POST   /alertas               → registra alerta manual
// PUT    /alertas/:id/status    → atualiza status (ATENDIDO/IGNORADO)
// DELETE /alertas/:id           → remove alerta
// =============================================================

const AlertasContext = React.createContext(null)

export function AlertasProvider({ children }) {
  const [alertas, setAlertas] = React.useState(() => {
    if (typeof window === "undefined") return dadosIniciais
    try {
      const salvo = localStorage.getItem("orbis-alertas")
      return salvo ? JSON.parse(salvo) : dadosIniciais
    } catch {
      return dadosIniciais
    }
  })

  React.useEffect(() => {
    try {
      localStorage.setItem("orbis-alertas", JSON.stringify(alertas))
    } catch {}
  }, [alertas])

  function adicionarAlerta(dados) {
    const novo = {
      ...dados,
      id: alertas.length > 0 ? Math.max(...alertas.map(a => a.id)) + 1 : 1,
      status: "ABERTO",
      criadoEm: new Date().toISOString(),
    }
    setAlertas(prev => [novo, ...prev])
    return novo
  }

  function editarAlerta(id, dados) {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, ...dados } : a))
  }

  function atualizarStatus(id, novoStatus) {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, status: novoStatus } : a))
  }

  function excluirAlerta(id) {
    setAlertas(prev => prev.filter(a => a.id !== id))
  }

  function resetarDados() {
    setAlertas(dadosIniciais)
    localStorage.removeItem("orbis-alertas")
  }

  return (
    <AlertasContext.Provider value={{ alertas, adicionarAlerta, editarAlerta, atualizarStatus, excluirAlerta, resetarDados }}>
      {children}
    </AlertasContext.Provider>
  )
}

export function useAlertas() {
  const ctx = React.useContext(AlertasContext)
  if (!ctx) throw new Error("useAlertas deve ser usado dentro de AlertasProvider")
  return ctx
}