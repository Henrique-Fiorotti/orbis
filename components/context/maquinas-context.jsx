// @ts-check

"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/data.json"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").Maquina} Maquina */
/** @typedef {import("@/lib/orbis-types").NovaMaquinaInput} NovaMaquinaInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoMaquinaInput} AtualizacaoMaquinaInput */
/** @typedef {import("@/lib/orbis-types").MaquinasContextValue} MaquinasContextValue */

const STORAGE_KEY = "orbis-maquinas"

/** @type {Maquina[]} */
const MAQUINAS_INICIAIS = dadosIniciais

/** @type {React.Context<MaquinasContextValue | null>} */
const MaquinasContext = React.createContext(null)

/**
 * @returns {Maquina[]}
 */
function carregarMaquinas() {
  if (typeof window === "undefined") return MAQUINAS_INICIAIS

  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo ? /** @type {Maquina[]} */ (JSON.parse(salvo)) : MAQUINAS_INICIAIS
  } catch {
    return MAQUINAS_INICIAIS
  }
}

/**
 * @param {WithChildrenProps} props
 */
export function MaquinasProvider({ children }) {
  const [maquinas, setMaquinas] = React.useState(() => carregarMaquinas())

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(maquinas))
    } catch {}
  }, [maquinas])

  /**
   * @param {NovaMaquinaInput} dados
   * @returns {Maquina}
   */
  function adicionarMaquina(dados) {
    const nova = {
      ...dados,
      id: maquinas.length > 0 ? Math.max(...maquinas.map((maquina) => maquina.id)) + 1 : 1,
      integridade: 100,
      scoreEstabilidade: 100,
      status: "OK",
      ultimaLeituraEm: new Date().toISOString(),
      sensores: 0,
    }

    setMaquinas((prev) => [nova, ...prev])
    return nova
  }

  /**
   * @param {number} id
   * @param {AtualizacaoMaquinaInput} dados
   */
  function editarMaquina(id, dados) {
    setMaquinas((prev) => prev.map((maquina) => (maquina.id === id ? { ...maquina, ...dados } : maquina)))
  }

  /**
   * @param {number} id
   */
  function excluirMaquina(id) {
    setMaquinas((prev) => prev.filter((maquina) => maquina.id !== id))
  }

  function resetarDados() {
    setMaquinas(MAQUINAS_INICIAIS)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <MaquinasContext.Provider value={{ maquinas, adicionarMaquina, editarMaquina, excluirMaquina, resetarDados }}>
      {children}
    </MaquinasContext.Provider>
  )
}

/**
 * @returns {MaquinasContextValue}
 */
export function useMaquinas() {
  const ctx = React.useContext(MaquinasContext)

  if (!ctx) {
    throw new Error("useMaquinas deve ser usado dentro de MaquinasProvider")
  }

  return /** @type {MaquinasContextValue} */ (ctx)
}
