"use client"

import * as React from "react"
import { toast } from "sonner"

import { useAuthSession } from "@/hooks/use-auth-session"
import { saveAuthSession } from "@/lib/auth-session"
import {
  fetchCurrentUserProfile,
  mergeProfileFallback,
  normalizeTecnico,
  updateCurrentUserProfile,
} from "@/lib/users-api"
import { ProfilePage } from "@/components/profile-page"

export default function PerfilPage() {
  const session = useAuthSession()
  const sessionFallback = React.useMemo(
    () => normalizeTecnico(session?.usuario, { role: session?.role }),
    [session?.role, session?.usuario]
  )
  const [profile, setProfile] = React.useState(sessionFallback)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  React.useEffect(() => {
    setProfile(sessionFallback)
  }, [sessionFallback])

  React.useEffect(() => {
    let isActive = true

    if (!session?.accessToken) {
      setLoading(false)
      return
    }

    async function loadProfile() {
      setLoading(true)
      setErrorMessage("")

      try {
        const apiProfile = await fetchCurrentUserProfile()

        if (!isActive) {
          return
        }

        const nextProfile = mergeProfileFallback(apiProfile, sessionFallback)
        setProfile(nextProfile)
        saveAuthSession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          usuario: nextProfile,
          role: nextProfile.role,
        })
      } catch (error) {
        if (!isActive) {
          return
        }

        setProfile(sessionFallback)
        setErrorMessage(
          error instanceof Error
            ? `${error.message} Exibindo os dados atuais da sessao.`
            : "Nao foi possivel carregar o perfil."
        )
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isActive = false
    }
  }, [session?.accessToken])

  async function handleSave(nextProfile) {
    if (!session?.accessToken) {
      toast.error("Sua sessao expirou. Faca login novamente.")
      return
    }

    setSaving(true)

    try {
      const updatedProfile = await updateCurrentUserProfile(nextProfile, {
        includeRole: session.role === "ADMIN",
        includeStatus: false,
      })
      const mergedProfile = mergeProfileFallback(updatedProfile, nextProfile)
      setProfile(mergedProfile)
      setErrorMessage("")
      saveAuthSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        usuario: mergedProfile,
        role: mergedProfile.role,
      })
      toast.success("Perfil atualizado com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel salvar o perfil.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProfilePage
      title="Meu Perfil"
      description="Gerencie suas informacoes pessoais e preferencias de conta."
      profile={profile}
      loading={loading}
      saving={saving}
      errorMessage={errorMessage}
      canEditRole={session?.role === "ADMIN"}
      canEditStatus={false}
      onSave={handleSave}
    />
  )
}
