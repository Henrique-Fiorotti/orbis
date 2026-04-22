"use client"

import * as React from "react"

import { clearAuthSession, getAuthSession, isAdminSession } from "@/lib/auth-session"
import {
  createTecnico,
  deleteTecnico,
  fetchTecnicos,
  normalizeTecnico,
  updateTecnico,
} from "@/lib/users-api"

/** @typedef {import("@/lib/orbis-types").WithChildrenProps} WithChildrenProps */
/** @typedef {import("@/lib/orbis-types").Tecnico} Tecnico */
/** @typedef {import("@/lib/orbis-types").NovoTecnicoInput} NovoTecnicoInput */
/** @typedef {import("@/lib/orbis-types").AtualizacaoTecnicoInput} AtualizacaoTecnicoInput */
/** @typedef {import("@/lib/orbis-types").TecnicosContextValue} TecnicosContextValue */

/** @type {React.Context<TecnicosContextValue | null>} */
const TecnicosContext = React.createContext(null)

/**
 * @param {WithChildrenProps} props
 */
export function TecnicosProvider({ children }) {
  const [tecnicos, setTecnicos] = React.useState([])
  const [status, setStatus] = React.useState("idle")
  const [mensagem, setMensagem] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  const carregarTecnicos = React.useCallback(async ({ silent = false } = {}) => {
    const session = getAuthSession()

    if (!session?.accessToken) {
      setTecnicos([])
      setStatus("error")
      setMensagem("Faca login para carregar os tecnicos.")
      return
    }

    if (!isAdminSession(session)) {
      setTecnicos([])
      setStatus("idle")
      setMensagem("")
      return
    }

    if (!silent) {
      setStatus("loading")
      setMensagem("Carregando tecnicos...")
    }

    try {
      const nextTecnicos = await fetchTecnicos()
      setTecnicos(nextTecnicos)
      setStatus("success")
      setMensagem("")
    } catch (error) {
      if (error?.status === 401) {
        clearAuthSession()
      }

      const nextMessage =
        error instanceof Error ? error.message : "Nao foi possivel carregar os tecnicos."
      setStatus("error")
      setMensagem(nextMessage)
      setTecnicos((current) => (silent ? current : []))
      throw error
    }
  }, [])

  React.useEffect(() => {
    carregarTecnicos().catch(() => {})
  }, [carregarTecnicos])

  const executarMutacao = React.useCallback(async (callback, fallbackLabel) => {
    setSalvando(true)

    try {
      const result = await callback()
      await carregarTecnicos({ silent: true })
      setStatus("success")
      setMensagem("")
      return result
    } catch (error) {
      if (error?.status === 401) {
        clearAuthSession()
      }

      const nextMessage = error instanceof Error ? error.message : fallbackLabel
      setStatus("error")
      setMensagem(nextMessage)
      throw error instanceof Error ? error : new Error(nextMessage)
    } finally {
      setSalvando(false)
    }
  }, [carregarTecnicos])

  /**
   * @param {NovoTecnicoInput} dados
   * @returns {Tecnico}
   */
  const adicionarTecnico = React.useCallback(async (dados) => (
    executarMutacao(
      async () => normalizeTecnico(await createTecnico(dados), dados),
      "Nao foi possivel cadastrar o tecnico."
    )
  ), [executarMutacao])

  /**
   * @param {number} id
   * @param {AtualizacaoTecnicoInput} dados
   */
  const editarTecnico = React.useCallback(async (id, dados) => (
    executarMutacao(
      async () => normalizeTecnico(await updateTecnico(id, dados), { id, ...dados }),
      "Nao foi possivel atualizar o tecnico."
    )
  ), [executarMutacao])

  /**
   * @param {number} id
   */
  const excluirTecnico = React.useCallback(async (id) => {
    await executarMutacao(
      async () => {
        await deleteTecnico(id)
      },
      "Nao foi possivel remover o tecnico."
    )
  }, [executarMutacao])

  const buscarTecnicoPorId = React.useCallback((id) => (
    tecnicos.find((tecnico) => tecnico.id === id) ?? null
  ), [tecnicos])

  const recarregarTecnicos = React.useCallback(async () => {
    await carregarTecnicos()
  }, [carregarTecnicos])

  const resetarDados = React.useCallback(async () => {
    await carregarTecnicos()
  }, [carregarTecnicos])

  const value = React.useMemo(() => ({
    tecnicos,
    status,
    mensagem,
    carregando: status === "loading",
    salvando,
    adicionarTecnico,
    editarTecnico,
    excluirTecnico,
    buscarTecnicoPorId,
    recarregarTecnicos,
    resetarDados,
  }), [
    tecnicos,
    status,
    mensagem,
    salvando,
    adicionarTecnico,
    editarTecnico,
    excluirTecnico,
    buscarTecnicoPorId,
    recarregarTecnicos,
    resetarDados,
  ])

  return (
    <TecnicosContext.Provider value={value}>
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
