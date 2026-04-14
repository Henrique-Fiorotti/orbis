// @ts-check

/** @typedef {import("@/lib/orbis-types").Maquina} Maquina */
/** @typedef {import("@/lib/orbis-types").CriticidadeChartDatum} CriticidadeChartDatum */
/** @typedef {import("@/lib/orbis-types").IntegridadeSetorChartDatum} IntegridadeSetorChartDatum */

const CRITICIDADE_LABEL = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAIXA: "Baixa",
}

const SETOR_LABEL_OVERRIDES = {
  "linha de producao a": "Linha A",
  "linha de producao b": "Linha B",
  "setor hidraulico": "Hidraulico",
  "esteira principal": "Esteira",
  resfriamento: "Resfriamento",
  usinagem: "Usinagem",
  conformacao: "Conformacao",
}

/**
 * @param {string} setor
 * @returns {string}
 */
function formatarSetorLabel(setor) {
  const setorNormalizado = setor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (SETOR_LABEL_OVERRIDES[setorNormalizado]) {
    return SETOR_LABEL_OVERRIDES[setorNormalizado]
  }

  return setorNormalizado
    .replace(/^linha de producao\s+/i, "Linha ")
    .replace(/^setor\s+/i, "")
    .replace(/^linha\s+/i, "Linha ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase())
}

/**
 * @param {Maquina[]} maquinas
 * @returns {CriticidadeChartDatum[]}
 */
export function getMaquinasPorCriticidade(maquinas) {
  return ["ALTA", "MEDIA", "BAIXA"].map((criticidade) => {
    const maquinasDaFaixa = maquinas.filter((maquina) => maquina.criticidade === criticidade)

    return {
      criticidade,
      label: CRITICIDADE_LABEL[criticidade],
      operando: maquinasDaFaixa.filter((maquina) => maquina.status === "OK").length,
      emAlerta: maquinasDaFaixa.filter((maquina) => maquina.status !== "OK").length,
    }
  })
}

/**
 * @param {Maquina[]} maquinas
 * @returns {IntegridadeSetorChartDatum[]}
 */
export function getIntegridadePorSetor(maquinas) {
  /** @type {Map<string, { totalIntegridade: number, maquinas: number }>} */
  const agrupado = maquinas.reduce((acc, maquina) => {
    const atual = acc.get(maquina.setor)

    if (atual) {
      atual.totalIntegridade += maquina.integridade
      atual.maquinas += 1
      return acc
    }

    acc.set(maquina.setor, {
      totalIntegridade: maquina.integridade,
      maquinas: 1,
    })

    return acc
  }, new Map())

  return Array.from(agrupado.entries())
    .map(([setor, valores]) => ({
      setor,
      setorLabel: formatarSetorLabel(setor),
      integridade: Math.round(valores.totalIntegridade / valores.maquinas),
      maquinas: valores.maquinas,
    }))
    .sort((a, b) => b.integridade - a.integridade)
}
