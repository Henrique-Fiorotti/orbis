"use client"

import * as React from "react"
import dadosIniciais from "@/app/dashboard/sensores/data.json"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").Sensor} Sensor */
/** @typedef {import("@/lib/orbis-types").NovoSensorInput} NovoSensorInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoSensorInput} AtualizacaoSensorInput */
/** @typedef {import("@/lib/orbis-types").SensoresContextValue} SensoresContextValue */

const STORAGE_KEY = "orbis-sensores"

/** @type {Sensor[]} */
const SENSORES_INICIAIS = dadosIniciais

/** @type {React.Context<SensoresContextValue | null>} */
const SensoresContext = React.createContext(null)

/**
 * @returns {Sensor[]}
 */
function carregarSensores() {
  if (typeof window === "undefined") return SENSORES_INICIAIS

  try {
    const salvo = localStorage.getItem(STORAGE_KEY)
    return salvo ? /** @type {Sensor[]} */ (JSON.parse(salvo)) : SENSORES_INICIAIS
  } catch {
    return SENSORES_INICIAIS
  }
}

/**
 * @param {WithChildrenProps} props
 */
export function SensoresProvider({ children }) {
  const [sensores, setSensores] = React.useState(() => carregarSensores())

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sensores))
    } catch {}
  }, [sensores])

  /**
   * @param {NovoSensorInput} dados
   * @returns {Sensor}
   */
  function adicionarSensor(dados) {
    const novo = {
      ...dados,
      id: sensores.length > 0 ? Math.max(...sensores.map((sensor) => sensor.id)) + 1 : 1,
      status: "ONLINE",
      ultimaLeituraEm: new Date().toISOString(),
    }

    setSensores((prev) => [novo, ...prev])
    return novo
  }

  /**
   * @param {number} id
   * @param {AtualizacaoSensorInput} dados
   */
  function editarSensor(id, dados) {
    setSensores((prev) => prev.map((sensor) => (sensor.id === id ? { ...sensor, ...dados } : sensor)))
  }

  /**
   * @param {number} id
   */
  function excluirSensor(id) {
    setSensores((prev) => prev.filter((sensor) => sensor.id !== id))
  }

  function resetarDados() {
    setSensores(SENSORES_INICIAIS)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <SensoresContext.Provider value={{ sensores, adicionarSensor, editarSensor, excluirSensor, resetarDados }}>
      {children}
    </SensoresContext.Provider>
  )
}

/**
 * @returns {SensoresContextValue}
 */
export function useSensores() {
  const ctx = React.useContext(SensoresContext)

  if (!ctx) {
    throw new Error("useSensores deve ser usado dentro de SensoresProvider")
  }

  return /** @type {SensoresContextValue} */ (ctx)
}
