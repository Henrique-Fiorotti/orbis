"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/data.json"

const MaquinasContext = React.createContext(null)

export function MaquinasProvider({ children }) {
  const [maquinas, setMaquinas] = React.useState(() => {
    if (typeof window === "undefined") return dadosIniciais
    try {
      const salvo = localStorage.getItem("orbis-maquinas")
      return salvo ? JSON.parse(salvo) : dadosIniciais
    } catch {
      return dadosIniciais
    }
  })

  // Persiste no localStorage sempre que maquinas mudar
  React.useEffect(() => {
    try {
      localStorage.setItem("orbis-maquinas", JSON.stringify(maquinas))
    } catch {}
  }, [maquinas])

  function adicionarMaquina(dados) {
    const nova = {
      ...dados,
      id: maquinas.length > 0 ? Math.max(...maquinas.map(m => m.id)) + 1 : 1,
      integridade: 100,
      scoreEstabilidade: 100,
      status: "OK",
      ultimaLeituraEm: new Date().toISOString(),
      sensores: 0,
    }
    setMaquinas(prev => [nova, ...prev])
    return nova
  }

  function editarMaquina(id, dados) {
    setMaquinas(prev => prev.map(m => m.id === id ? { ...m, ...dados } : m))
  }

  function excluirMaquina(id) {
    setMaquinas(prev => prev.filter(m => m.id !== id))
  }

  function resetarDados() {
    setMaquinas(dadosIniciais)
    localStorage.removeItem("orbis-maquinas")
  }

  return (
    <MaquinasContext.Provider value={{ maquinas, adicionarMaquina, editarMaquina, excluirMaquina, resetarDados }}>
      {children}
    </MaquinasContext.Provider>
  )
}

export function useMaquinas() {
  const ctx = React.useContext(MaquinasContext)
  if (!ctx) throw new Error("useMaquinas deve ser usado dentro de MaquinasProvider")
  return ctx
}