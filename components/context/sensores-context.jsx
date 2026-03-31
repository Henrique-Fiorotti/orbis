"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/sensores/data.json"

// =============================================================
// INTEGRAÇÃO COM A API — quando a API estiver pronta:
//
// GET  /sensores           → lista todos os sensores
// POST /sensores           → cria novo sensor
// PUT  /sensores/:id       → atualiza sensor
// DELETE /sensores/:id     → remove sensor
// =============================================================

const SensoresContext = React.createContext(null)

export function SensoresProvider({ children }) {
  const [sensores, setSensores] = React.useState(() => {
    if (typeof window === "undefined") return dadosIniciais
    try {
      const salvo = localStorage.getItem("orbis-sensores")
      return salvo ? JSON.parse(salvo) : dadosIniciais
    } catch {
      return dadosIniciais
    }
  })

  React.useEffect(() => {
    try {
      localStorage.setItem("orbis-sensores", JSON.stringify(sensores))
    } catch {}
  }, [sensores])

  function adicionarSensor(dados) {
    const novo = {
      ...dados,
      id: sensores.length > 0 ? Math.max(...sensores.map(s => s.id)) + 1 : 1,
      status: "ONLINE",
      valorAtual: 0,
      ultimaLeituraEm: new Date().toISOString(),
    }
    setSensores(prev => [novo, ...prev])
    return novo
  }

  function editarSensor(id, dados) {
    setSensores(prev => prev.map(s => s.id === id ? { ...s, ...dados } : s))
  }

  function excluirSensor(id) {
    setSensores(prev => prev.filter(s => s.id !== id))
  }

  function resetarDados() {
    setSensores(dadosIniciais)
    localStorage.removeItem("orbis-sensores")
  }

  return (
    <SensoresContext.Provider value={{ sensores, adicionarSensor, editarSensor, excluirSensor, resetarDados }}>
      {children}
    </SensoresContext.Provider>
  )
}

export function useSensores() {
  const ctx = React.useContext(SensoresContext)
  if (!ctx) throw new Error("useSensores deve ser usado dentro de SensoresProvider")
  return ctx
}