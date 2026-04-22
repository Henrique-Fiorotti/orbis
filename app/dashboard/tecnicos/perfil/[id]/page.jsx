"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useAuthSession } from "@/hooks/use-auth-session"
import { useTecnicos } from "@/components/context/tecnicos-context"
import { ProfilePage } from "@/components/profile-page"
import { fetchTecnicoById, mergeProfileFallback } from "@/lib/users-api"

export default function TecnicoPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const session = useAuthSession()
  const isAdmin = session?.role === "ADMIN"
  const tecnicoId = Number(params?.id)
  const { buscarTecnicoPorId, editarTecnico, excluirTecnico } = useTecnicos()
  const tecnicoFallback = React.useMemo(
    () => (Number.isFinite(tecnicoId) ? buscarTecnicoPorId(tecnicoId) : null),
    [buscarTecnicoPorId, tecnicoId]
  )

  const [profile, setProfile] = React.useState(tecnicoFallback)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  React.useEffect(() => {
    if (session && !isAdmin) {
      router.replace("/dashboard/perfil")
    }
  }, [session, isAdmin, router])

  React.useEffect(() => {
    setProfile(tecnicoFallback)
  }, [tecnicoFallback])

  React.useEffect(() => {
    let isActive = true

    if (!Number.isFinite(tecnicoId)) {
      setLoading(false)
      setErrorMessage("Tecnico invalido.")
      return
    }

    if (session && !isAdmin) {
      return
    }

    async function loadTecnico() {
      setLoading(true)
      setErrorMessage("")

      try {
        const apiProfile = await fetchTecnicoById(tecnicoId)

        if (!isActive) {
          return
        }

        setProfile(mergeProfileFallback(apiProfile, tecnicoFallback))
      } catch (error) {
        if (!isActive) {
          return
        }

        if (tecnicoFallback) {
          setProfile(tecnicoFallback)
          setErrorMessage(
            error instanceof Error
              ? `${error.message} Exibindo os dados ja carregados da lista.`
              : "Nao foi possivel atualizar os dados completos deste tecnico."
          )
        } else {
          setProfile(null)
          setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel carregar este tecnico.")
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadTecnico()

    return () => {
      isActive = false
    }
  }, [session, isAdmin, tecnicoFallback, tecnicoId])

  async function handleSave(nextProfile) {
    setSaving(true)

    try {
      const updatedProfile = await editarTecnico(tecnicoId, nextProfile)
      const mergedProfile = mergeProfileFallback(updatedProfile, nextProfile)
      setProfile(mergedProfile)
      setErrorMessage("")
      toast.success("Perfil do tecnico atualizado com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar este tecnico.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)

    try {
      await excluirTecnico(tecnicoId)
      toast.success("Tecnico removido com sucesso.")
      router.replace("/dashboard/tecnicos")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel remover este tecnico.")
      setSaving(false)
    }
  }

  if (session && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
        Redirecionando para o seu perfil...
      </div>
    )
  }

  return (
    <ProfilePage
      title="Perfil do Tecnico"
      description="Visualize e edite os dados completos deste tecnico em uma rota dedicada."
      profile={profile}
      loading={loading}
      saving={saving}
      errorMessage={errorMessage}
      canEditRole
      canEditStatus
      onSave={handleSave}
      onDelete={handleDelete}
      onBack={() => router.push("/dashboard/tecnicos")}
    />
  )
}
