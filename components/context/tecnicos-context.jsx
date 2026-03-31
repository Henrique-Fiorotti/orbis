"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/tecnicos/data.json"

// =============================================================
// INTEGRAÇÃO COM A API — quando a API estiver pronta:
//
// GET    /tecnicos         → lista todos os técnicos
// POST   /tecnicos         → cria novo técnico
// PUT    /tecnicos/:id     → atualiza técnico
// DELETE /tecnicos/:id     → remove técnico
// =============================================================

const TecnicosContext = React.createContext(null)

export function TecnicosProvider({ children }) {
  const [tecnicos, setTecnicos] = React.useState(() => {
    if (typeof window === "undefined") return dadosIniciais
    try {
      const salvo = localStorage.getItem("orbis-tecnicos")
      return salvo ? JSON.parse(salvo) : dadosIniciais
    } catch {
      return dadosIniciais
    }
  })

  React.useEffect(() => {
    try {
      localStorage.setItem("orbis-tecnicos", JSON.stringify(tecnicos))
    } catch {}
  }, [tecnicos])

  function adicionarTecnico(dados) {
    const novo = {
      ...dados,
      id: tecnicos.length > 0 ? Math.max(...tecnicos.map(t => t.id)) + 1 : 1,
      alertasAtendidos: 0,
      criadoEm: new Date().toISOString(),
    }
    setTecnicos(prev => [novo, ...prev])
    return novo
  }

  function editarTecnico(id, dados) {
    setTecnicos(prev => prev.map(t => t.id === id ? { ...t, ...dados } : t))
  }

  function excluirTecnico(id) {
    setTecnicos(prev => prev.filter(t => t.id !== id))
  }

  function resetarDados() {
    setTecnicos(dadosIniciais)
    localStorage.removeItem("orbis-tecnicos")
  }

  return (
    <TecnicosContext.Provider value={{ tecnicos, adicionarTecnico, editarTecnico, excluirTecnico, resetarDados }}>
      {children}
    </TecnicosContext.Provider>
  )
}

export function useTecnicos() {
  const ctx = React.useContext(TecnicosContext)
  if (!ctx) throw new Error("useTecnicos deve ser usado dentro de TecnicosProvider")
  return ctx
}