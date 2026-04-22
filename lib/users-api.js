import { apiFetch } from "@/utils/apiFetch"
import {
  normalizeRole,
  normalizeUserRecord,
  pickFirstDefined,
  pickFirstString,
} from "@/lib/user-models"

const SELF_PROFILE_ENDPOINTS = ["/usuarios/me", "/perfil"]
const UPDATE_METHODS = ["PUT", "PATCH"]

function extractCollection(payload) {
  const candidates = [
    payload,
    payload?.content,
    payload?.dados,
    payload?.data,
    payload?.items,
    payload?.resultado,
    payload?.results,
    payload?.usuarios,
    payload?.tecnicos,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

function shouldTryNextEndpoint(error) {
  return error?.status === 404 || error?.status === 405
}

function omitEmptyValues(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
  )
}

export function normalizeTecnico(raw, fallback = {}) {
  return normalizeUserRecord(raw, {
    role: normalizeRole(raw?.role ?? fallback.role, "TECNICO"),
    status: raw?.status ?? fallback.status ?? "ATIVO",
    ...fallback,
  })
}

export function buildUserPayload(data, { includeRole = false, includeStatus = true } = {}) {
  const role = normalizeRole(data?.role, "TECNICO")

  return omitEmptyValues({
    nome: pickFirstString(data?.nome),
    email: pickFirstString(data?.email),
    telefone: pickFirstString(data?.telefone),
    especialidade: pickFirstString(data?.especialidade),
    setor: pickFirstString(data?.setor),
    ...(includeStatus ? { status: pickFirstString(data?.status) } : {}),
    foto: data?.foto ?? null,
    ...(includeRole ? { role } : {}),
  })
}

async function fetchFirstSuccessful(endpoints, factory) {
  let lastError = null

  for (const endpoint of endpoints) {
    try {
      return await factory(endpoint)
    } catch (error) {
      if (shouldTryNextEndpoint(error)) {
        lastError = error
        continue
      }

      throw error
    }
  }

  if (lastError) {
    throw lastError
  }

  return null
}

async function mutateFirstSuccessful(
  endpoints,
  payload,
  { includeRole = false, includeStatus = true } = {}
) {
  let lastError = null

  for (const endpoint of endpoints) {
    for (const method of UPDATE_METHODS) {
      try {
        const response = await apiFetch(endpoint, {
          auth: "auto",
          method,
          body: buildUserPayload(payload, { includeRole, includeStatus }),
        })

        return normalizeTecnico(response ?? payload, payload)
      } catch (error) {
        if (shouldTryNextEndpoint(error)) {
          lastError = error
          continue
        }

        throw error
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  return normalizeTecnico(payload)
}

export async function fetchTecnicos() {
  const payload = await apiFetch("/tecnicos", {
    auth: "auto",
    method: "GET",
  })

  return extractCollection(payload).map((item) => normalizeTecnico(item))
}

export async function fetchTecnicoById(id) {
  const payload = await apiFetch(`/tecnicos/${id}`, {
    auth: "auto",
    method: "GET",
  })

  return normalizeTecnico(payload, { id: Number(id) })
}

export async function createTecnico(payload) {
  const response = await apiFetch("/tecnicos", {
    auth: "auto",
    method: "POST",
    body: buildUserPayload(payload, { includeRole: true }),
  })

  return normalizeTecnico(response ?? payload, payload)
}

export async function updateTecnico(id, payload) {
  return mutateFirstSuccessful([`/tecnicos/${id}`], payload, {
    includeRole: true,
    includeStatus: true,
  })
}

export async function deleteTecnico(id) {
  await apiFetch(`/tecnicos/${id}`, {
    auth: "auto",
    method: "DELETE",
  })
}

export async function fetchCurrentUserProfile() {
  return fetchFirstSuccessful(SELF_PROFILE_ENDPOINTS, async (endpoint) => {
    const response = await apiFetch(endpoint, {
      auth: "auto",
      method: "GET",
    })

    return normalizeTecnico(response)
  })
}

export async function updateCurrentUserProfile(payload, options = {}) {
  return mutateFirstSuccessful(SELF_PROFILE_ENDPOINTS, payload, options)
}

export function mergeProfileFallback(primaryProfile, fallbackProfile) {
  return normalizeTecnico(primaryProfile, {
    id: pickFirstDefined(primaryProfile?.id, fallbackProfile?.id),
    nome: pickFirstString(primaryProfile?.nome, fallbackProfile?.nome),
    email: pickFirstString(primaryProfile?.email, fallbackProfile?.email),
    telefone: pickFirstString(primaryProfile?.telefone, fallbackProfile?.telefone),
    especialidade: pickFirstString(primaryProfile?.especialidade, fallbackProfile?.especialidade),
    setor: pickFirstString(primaryProfile?.setor, fallbackProfile?.setor),
    status: primaryProfile?.status ?? fallbackProfile?.status,
    role: primaryProfile?.role ?? fallbackProfile?.role,
    foto: primaryProfile?.foto ?? fallbackProfile?.foto ?? null,
    alertasAtendidos: pickFirstDefined(
      primaryProfile?.alertasAtendidos,
      fallbackProfile?.alertasAtendidos,
      0
    ),
    criadoEm: pickFirstString(primaryProfile?.criadoEm, fallbackProfile?.criadoEm),
    ultimoLoginEm: pickFirstString(primaryProfile?.ultimoLoginEm, fallbackProfile?.ultimoLoginEm),
  })
}
