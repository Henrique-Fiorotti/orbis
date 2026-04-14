// @ts-check

"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/tecnicos/data.json"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").Tecnico} Tecnico */
/** @typedef {import("@/lib/orbis-types").NovoTecnicoInput} NovoTecnicoInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoTecnicoInput} AtualizacaoTecnicoInput */
/** @typedef {import("@/lib/orbis-types").TecnicosContextValue} TecnicosContextValue */

const STORAGE_KEY = "orbis-tecnicos"

/** @type {Tecnico[]} */
const TECNICOS_INICIAIS = dadosIniciais

/** @type {React.Context<TecnicosContextValue | null>} */
const TecnicosContext = React.createContext(null)

/**
 * @returns {Tecnico[]}
 */
function carregarTecnicos() {
  if (typeof window === "undefined") return TECNICOS_INICIAIS

  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo ? /** @type {Tecnico[]} */ (JSON.parse(salvo)) : TECNICOS_INICIAIS
  } catch {
    return TECNICOS_INICIAIS
  }
}

/**
 * @param {WithChildrenProps} props
 */
export function TecnicosProvider({ children }) {
  const [tecnicos, setTecnicos] = React.useState(() => carregarTecnicos())

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tecnicos))
    } catch {}
  }, [tecnicos])

  /**
   * @param {NovoTecnicoInput} dados
   * @returns {Tecnico}
   */
  function adicionarTecnico(dados) {
    const novo = {
      ...dados,
      id: tecnicos.length > 0 ? Math.max(...tecnicos.map((tecnico) => tecnico.id)) + 1 : 1,
      alertasAtendidos: 0,
      criadoEm: new Date().toISOString(),
    }

    setTecnicos((prev) => [novo, ...prev])
    return novo
  }

  /**
   * @param {number} id
   * @param {AtualizacaoTecnicoInput} dados
   */
  function editarTecnico(id, dados) {
    setTecnicos((prev) => prev.map((tecnico) => (tecnico.id === id ? { ...tecnico, ...dados } : tecnico)))
  }

  /**
   * @param {number} id
   */
  function excluirTecnico(id) {
    setTecnicos((prev) => prev.filter((tecnico) => tecnico.id !== id))
  }

  function resetarDados() {
    setTecnicos(TECNICOS_INICIAIS)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <TecnicosContext.Provider value={{ tecnicos, adicionarTecnico, editarTecnico, excluirTecnico, resetarDados }}>
      {children}
    </TecnicosContext.Provider>
  )
}

/**
 * @returns {TecnicosContextValue}
 */
export function useTecnicos() {
  const ctx = React.useContext(TecnicosContext)

  if (!ctx) {
    throw new Error("useTecnicos deve ser usado dentro de TecnicosProvider")
  }

  return /** @type {TecnicosContextValue} */ (ctx)
}
