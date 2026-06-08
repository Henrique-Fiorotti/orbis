"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAlertas } from "@/components/context/alertas-context"
import { Lock } from "lucide-react";
import { ProfilePageSkeleton } from "@/components/dashboard-skeletons"
import { SiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CODE_LENGTH, OtpCodeInput } from "@/components/ui/otp-code-input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { clearAuthSession, getAuthSession, updateAuthSessionUser } from "@/lib/auth-session"
import { ProfilePhotoCropDialog } from "@/components/profile-photo-crop-dialog"
import { getHttpErrorStatus, requestDashboardJson } from "@/lib/dashboard-api"
import { isValidBackendPassword, isValidEmail } from "@/lib/form-formatters"
import { buildPerfilForm, buildPerfilUpdateBody } from "@/lib/profile-form.mjs"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CalendarIcon,
  CameraIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  ClockIcon,
  LockIcon,
  ShieldCheckIcon,
  UserIcon,
  WrenchIcon,
} from "lucide-react"

const EMPTY_FORM = {
  nome: "",
  email: "",
  role: "",
  telefone: "",
  especialidade: "",
}

const EMPTY_PERFIL = {
  id: null,
  nome: "",
  email: "",
  role: "",
  ativo: true,
  telefone: "",
  especialidade: "",
  fotoPerfil: "",
  caminhoFoto: "",
  criadoEm: null,
  atualizadoEm: null,
}

const TIPO_ALERTA_LABEL = {
  LIMITE_ULTRAPASSADO: "Limite ultrapassado",
  TENDENCIA_CURTA: "Tendência curta",
  TENDENCIA_LONGA: "Tendência longa",
  DEGRADACAO_ACELERADA: "Degradação acelerada",
  INSTABILIDADE: "Instabilidade",
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizePerfil(raw) {
  const source =
    raw && typeof raw === "object"
      ? raw.usuario ?? raw.data ?? raw.dados ?? raw
      : null

  if (!source || typeof source !== "object") {
    return EMPTY_PERFIL
  }

  return {
    ...EMPTY_PERFIL,
    ...source,
    nome: normalizeString(source.nome),
    email: normalizeString(source.email ?? source.emailUsuario),
    role: normalizeString(source.role),
    ativo: typeof source.ativo === "boolean" ? source.ativo : true,
    telefone: normalizeString(source.telefone),
    especialidade: normalizeString(source.especialidade),
    fotoPerfil: normalizeString(source.fotoPerfil ?? source.foto ?? source.avatar ?? source.imagem),
    caminhoFoto: normalizeString(source.caminhoFoto ?? source.caminhoImagem),
    criadoEm: normalizeString(source.criadoEm, null),
    atualizadoEm: normalizeString(source.atualizadoEm, null),
  }
}

function getFormFromPerfil(perfil) {
  return buildPerfilForm(perfil)
}

function getIniciais(nome) {
  const iniciais = normalizeString(nome)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")

  return iniciais || "U"
}

function getRoleLabel(role) {
  if (role === "ADMIN") return "Admin"
  if (role === "TECNICO") return "Técnico"
  return role || "Perfil não informado"
}

function getEspecialidadeLabel(perfil) {
  if (perfil.role === "ADMIN") return "Administrador"
  return perfil.especialidade || "Sem especialidade"
}

function formatDateTime(value) {
  if (!value) {
    return "Não informado"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Não informado"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function getAlertDate(alerta) {
  return alerta?.atualizadoEm || alerta?.ultimaOcorrenciaEm || alerta?.criadoEm || ""
}

function getAlertTimestamp(alerta) {
  const timestamp = Date.parse(getAlertDate(alerta))
  return Number.isFinite(timestamp) ? timestamp : 0
}

function isToday(value) {
  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) {
    return false
  }

  return date.toLocaleDateString("pt-BR") === new Date().toLocaleDateString("pt-BR")
}

function isAlertAssignedToPerfil(alerta, perfil) {
  if (!alerta || !perfil) {
    return false
  }

  if (alerta.tecnicoId !== null && alerta.tecnicoId !== undefined && perfil.id !== null && perfil.id !== undefined) {
    return String(alerta.tecnicoId) === String(perfil.id)
  }

  if (alerta.tecnicoNome && perfil.nome) {
    return normalizeText(alerta.tecnicoNome) === normalizeText(perfil.nome)
  }

  return false
}

function formatAlertType(value) {
  return TIPO_ALERTA_LABEL[value] ?? value ?? "Alerta"
}

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

function CriticidadeBadge({ value }) {
  const styles = {
    ALTA: "bg-red-100 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
    MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300",
    BAIXA: "bg-green-100 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300",
  }
  return (
    <Badge variant="outline" className={`px-1.5 ${styles[value]}`}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </Badge>
  )
}

function StatusMaquinaBadge({ value }) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {value === "OK" ? (
        <CircleCheckIcon className="fill-[#5E17EB]! dark:fill-primary!" />
      ) : (
        <AlertTriangleIcon className="text-red-500 dark:text-red-300" />
      )}
      {value}
    </Badge>
  )
}

function StatusAlertaBadge({ value }) {
  if (value === "RESOLVIDO") {
    return (
      <Badge variant="outline" className="px-1.5 bg-green-100 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
        Resolvido
      </Badge>
    )
  }

  if (value === "EM_ANDAMENTO") {
    return (
      <Badge variant="outline" className="px-1.5 bg-yellow-100 text-yellow-700 border-yellow-200 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-300">
        Em andamento
      </Badge>
    )
  }

  return <Badge variant="outline" className="px-1.5">{value}</Badge>
}

function AtendimentoMobileCard({ alerta, onOpen }) {
  return (
    <button
      type="button"
      className="group flex min-h-[124px] w-full cursor-pointer flex-col justify-between gap-3 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:border-[#5E17EB] focus-visible:border-[#5E17EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/20 dark:border-gray-700! dark:bg-[#0F172A]"
      onClick={() => onOpen(alerta)}
    >
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="line-clamp-2 text-base font-medium leading-tight text-foreground">
            {alerta.maquinaNome}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {alerta.sensorNome}
          </span>
        </span>
        <ChevronRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-[#5E17EB]" />
      </span>

      <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {alerta.mensagem}
      </span>

      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="px-1.5 text-xs text-muted-foreground">
            {formatAlertType(alerta.tipo)}
          </Badge>
          <StatusAlertaBadge value={alerta.status} />
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ClockIcon className="size-3" />
          {formatDateTime(getAlertDate(alerta))}
        </span>
      </span>
    </button>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { alertas, status: alertasStatus } = useAlertas()
  const [perfil, setPerfil] = React.useState(EMPTY_PERFIL)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando perfil...")
  const [salvandoDados, setSalvandoDados] = React.useState(false)
  const [salvandoFoto, setSalvandoFoto] = React.useState(false)
  const [salvandoSenha, setSalvandoSenha] = React.useState(false)
  const [senhaEtapa, setSenhaEtapa] = React.useState("solicitar")
  const [activeTab, setActiveTab] = React.useState("dados")
  const [atendimentoSelecionado, setAtendimentoSelecionado] = React.useState(null)
  const inputFotoRef = React.useRef(null)
  const [fotoParaAjustar, setFotoParaAjustar] = React.useState(null)
  const [senhas, setSenhas] = React.useState({
    atual: "",
    emailDestino: "",
    codigo: "",
    nova: "",
    confirmar: "",
  })

  const loading = status === "loading"
  const podeEditarIdentidade = status === "success" && perfil.role === "ADMIN"
  const podeVerMinhaAtividade = status === "success" && perfil.role === "TECNICO"
  const meusAtendimentos = React.useMemo(
    () => alertas
      .filter((alerta) => isAlertAssignedToPerfil(alerta, perfil))
      .sort((a, b) => getAlertTimestamp(b) - getAlertTimestamp(a)),
    [alertas, perfil]
  )
  const atendimentosResolvidos = React.useMemo(
    () => meusAtendimentos.filter((alerta) => alerta.status === "RESOLVIDO"),
    [meusAtendimentos]
  )
  const atendimentosEmAndamento = React.useMemo(
    () => meusAtendimentos.filter((alerta) => alerta.status === "EM_ANDAMENTO"),
    [meusAtendimentos]
  )
  const resolvidosHoje = React.useMemo(
    () => atendimentosResolvidos.filter((alerta) => isToday(getAlertDate(alerta))).length,
    [atendimentosResolvidos]
  )
  const maquinasAtendidas = React.useMemo(
    () => new Set(meusAtendimentos.map((alerta) => alerta.maquinaId ?? normalizeText(alerta.maquinaNome)).filter(Boolean)).size,
    [meusAtendimentos]
  )
  const atendimentoDetalhado = React.useMemo(() => {
    if (!atendimentoSelecionado?.id) {
      return atendimentoSelecionado
    }

    return meusAtendimentos.find((alerta) => String(alerta.id) === String(atendimentoSelecionado.id)) ?? atendimentoSelecionado
  }, [atendimentoSelecionado, meusAtendimentos])

  React.useEffect(() => {
    let isActive = true

    async function carregarPerfil() {
      const session = getAuthSession()

      if (!session?.accessToken) {
        setStatus("error")
        setMensagem("Faça login para carregar o perfil.")
        return
      }

      setStatus("loading")
      setMensagem("Carregando perfil...")

      try {
        const payload = await requestDashboardJson("/perfil", session.accessToken, "o perfil")
        const loadedPerfil = normalizePerfil(payload)
        const nextPerfil = {
          ...loadedPerfil,
          especialidade: loadedPerfil.especialidade || session.usuario?.especialidade || "",
        }

        if (!isActive) {
          return
        }

        setPerfil(nextPerfil)
        setForm(buildPerfilForm(nextPerfil, session.usuario))
        setSenhas((current) => ({
          ...current,
          emailDestino: current.emailDestino || nextPerfil.email,
        }))
        updateAuthSessionUser(nextPerfil)
        setStatus("success")
        setMensagem("")
      } catch (error) {
        if (!isActive) {
          return
        }

        if (getHttpErrorStatus(error) === 401) {
          clearAuthSession()
          router.replace("/")
          return
        }

        setStatus("error")
        setMensagem(getErrorMessage(error, "Não foi possível carregar o perfil."))
      }
    }

    carregarPerfil()

    return () => {
      isActive = false
    }
  }, [router])

  React.useEffect(() => {
    const requestedTab = searchParams.get("tab")

    if (requestedTab === "minha-atividade" && podeVerMinhaAtividade) {
      setActiveTab("minha-atividade")
      return
    }

    if (!podeVerMinhaAtividade) {
      setActiveTab((current) => current === "minha-atividade" ? "dados" : current)
    }
  }, [podeVerMinhaAtividade, searchParams])

  async function salvarDados() {
    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faça login para atualizar o perfil.")
      return
    }

    setSalvandoDados(true)

    try {
      const nome = form.nome.trim()
      const email = form.email.trim()
      const role = form.role || perfil.role
      const body = buildPerfilUpdateBody(form)

      if (podeEditarIdentidade) {
        if (nome !== perfil.nome) {
          if (!nome) {
            toast.error("Informe o nome.")
            return
          }
          body.nome = nome
        }

        if (email !== perfil.email) {
          if (!email) {
            toast.error("Informe o e-mail.")
            return
          }
          body.email = email
        }

        if (role !== perfil.role) {
          if (!role) {
            toast.error("Informe o cargo.")
            return
          }
          body.role = role
        }
      }

      const endpoint = podeEditarIdentidade && perfil.id ? `/usuarios/${perfil.id}` : "/perfil"
      let payload

      try {
        payload = await requestDashboardJson(endpoint, session.accessToken, "a atualização do perfil", {
          method: "PUT",
          body,
        })
      } catch (error) {
        if (!podeEditarIdentidade || !body.email) {
          throw error
        }

        const { email: _email, ...bodySemEmail } = body
        payload = await requestDashboardJson(endpoint, session.accessToken, "a atualização do perfil", {
          method: "PUT",
          body: {
            ...bodySemEmail,
            emailUsuario: body.email,
          },
        })
      }

      let nextPerfil = normalizePerfil({ ...perfil, ...payload, ...body })
      if (!nextPerfil.especialidade) {
        nextPerfil = {
          ...nextPerfil,
          especialidade: perfil.especialidade || session.usuario?.especialidade || "",
        }
      }

      if (podeEditarIdentidade) {
        const perfilAtualizado = await requestDashboardJson("/perfil", session.accessToken, "o perfil atualizado")
        nextPerfil = normalizePerfil({ ...perfil, ...perfilAtualizado })
        if (!nextPerfil.especialidade) {
          nextPerfil = {
            ...nextPerfil,
            especialidade: perfil.especialidade || session.usuario?.especialidade || "",
          }
        }

        if (body.email && nextPerfil.email !== body.email) {
          const { email: _email, ...bodySemEmail } = body

          payload = await requestDashboardJson(endpoint, session.accessToken, "a atualização do e-mail", {
            method: "PUT",
            body: {
              ...bodySemEmail,
              emailUsuario: body.email,
            },
          })

          const perfilAtualizadoComEmail = await requestDashboardJson("/perfil", session.accessToken, "o perfil atualizado")
          nextPerfil = normalizePerfil({ ...perfil, ...payload, ...perfilAtualizadoComEmail })
          if (!nextPerfil.especialidade) {
            nextPerfil = {
              ...nextPerfil,
              especialidade: perfil.especialidade || session.usuario?.especialidade || "",
            }
          }
        }

        if (body.email && nextPerfil.email !== body.email) {
          throw new Error("A API não confirmou a alteração do e-mail.")
        }
      }

      setPerfil(nextPerfil)
      setForm(getFormFromPerfil(nextPerfil))
      updateAuthSessionUser(nextPerfil)
      setStatus("success")
      setMensagem("")
      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
        router.replace("/")
        return
      }

      toast.error(getErrorMessage(error, "Não foi possível atualizar o perfil."))
    } finally {
      setSalvandoDados(false)
    }
  }

  function selecionarFoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!["image/png", "image/jpg", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem PNG, JPG, JPEG ou WEBP.")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15 MB.")
      return
    }

    setFotoParaAjustar(file)
  }

  async function enviarFoto(file) {
    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faça login para atualizar a foto.")
      return
    }

    const formData = new FormData()
    formData.append("imagem", file)

    setSalvandoFoto(true)

    try {
      const payload = await requestDashboardJson("/perfil/foto", session.accessToken, "o upload da foto do perfil", {
        method: "PUT",
        body: formData,
      })

      const nextPerfil = normalizePerfil({ ...perfil, ...payload })

      setPerfil(nextPerfil)
      setForm(getFormFromPerfil(nextPerfil))
      updateAuthSessionUser(nextPerfil)
      setStatus("success")
      setMensagem("")
      setFotoParaAjustar(null)
      toast.success("Foto atualizada com sucesso!")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
        router.replace("/")
        return
      }

      toast.error(getErrorMessage(error, "Não foi possível atualizar a foto."))
    } finally {
      setSalvandoFoto(false)
    }
  }

  function resetarFormularioSenha() {
    setSenhaEtapa("solicitar")
    setSenhas({
      atual: "",
      emailDestino: perfil.email || "",
      codigo: "",
      nova: "",
      confirmar: "",
    })
  }

  async function solicitarCodigoSenha() {
    if (!senhas.atual || !senhas.emailDestino) {
      toast.error("Informe a senha atual e o e-mail de destino.")
      return
    }

    if (!isValidEmail(senhas.emailDestino)) {
      toast.error("Informe um e-mail de destino válido.")
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faça login para alterar a senha.")
      return
    }

    setSalvandoSenha(true)

    try {
      const payload = await requestDashboardJson("/senha/solicitar-alteracao", session.accessToken, "a solicitação de alteração de senha", {
        method: "POST",
        body: {
          senhaAtual: senhas.atual,
          emailDestino: senhas.emailDestino.trim(),
        },
      })

      setSenhaEtapa("confirmar")
      setSenhas((current) => ({
        ...current,
        atual: "",
        codigo: "",
        nova: "",
        confirmar: "",
      }))
      toast.success(payload?.message || payload?.mensagem || "Código enviado para o e-mail informado.")
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
        router.replace("/")
        return
      }

      toast.error(getErrorMessage(error, "Não foi possível solicitar a alteração de senha."))
    } finally {
      setSalvandoSenha(false)
    }
  }

  async function confirmarAlteracaoSenha() {
    if (senhas.codigo.length !== CODE_LENGTH || !senhas.nova || !senhas.confirmar) {
      toast.error("Informe os 6 números do código e a nova senha.")
      return
    }

    if (!isValidBackendPassword(senhas.nova)) {
      toast.error("A senha precisa ter 7+ caracteres, letra maiúscula, minúscula e número.")
      return
    }

    if (senhas.nova !== senhas.confirmar) {
      toast.error("A nova senha e a confirmação não coincidem.")
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faça login para alterar a senha.")
      return
    }

    setSalvandoSenha(true)

    try {
      const payload = await requestDashboardJson("/senha/confirmar-alteracao", session.accessToken, "a confirmação de alteração de senha", {
        method: "POST",
        body: {
          code: senhas.codigo.trim(),
          novaSenha: senhas.nova,
        },
      })

      toast.success(payload?.message || payload?.mensagem || "Senha alterada com sucesso!")
      resetarFormularioSenha()
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
        router.replace("/")
        return
      }

      toast.error(getErrorMessage(error, "Não foi possível alterar a senha."))
    } finally {
      setSalvandoSenha(false)
    }
  }

  async function salvarSenha() {
    if (senhaEtapa === "confirmar") {
      await confirmarAlteracaoSenha()
      return
    }

    await solicitarCodigoSenha()
  }

  function abrirDetalhesAtendimento(alerta) {
    setAtendimentoSelecionado(alerta)
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <ProfilePageSkeleton />
      </>
    )
  }

  return (
    <>
      <SiteHeader />

      <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
        <div>
          <h1 className="text-xl font-semibold">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações pessoais e preferências de conta.
          </p>
        </div>

        <Separator />

        {mensagem ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${status === "error"
              ? "border-destructive/25 bg-destructive/5 text-destructive"
              : "border-border/60 bg-muted/30 text-muted-foreground"
              }`}
          >
            {mensagem}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-10 sm:gap-10 rounded-xl border bg-card p-5">
          <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-30 lg:h-30">
            <Avatar className="size-full! text-lg font-bold">
              <AvatarImage
                src={perfil.fotoPerfil || undefined}
                alt={form.nome || "Foto do perfil"}
                className="p-0 dark:invert-0"
              />
              <AvatarFallback className="bg-[#5E17EB] text-white text-xl sm:text-2xl lg:text-3xl font-bold">
                {getIniciais(form.nome)}
              </AvatarFallback>
            </Avatar>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/webp"
              className="hidden"
              onChange={selecionarFoto}
            />
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={loading || salvandoFoto}
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#5E17EB] text-white border-2 border-background hover:bg-[#4c11cc] transition-colors"
              aria-label={salvandoFoto ? "Enviando foto" : "Alterar foto"}
            >
              <CameraIcon className="size-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-start sm:text-left">
            <p className="font-semibold m-0 text-xl sm:text-2xl lg:text-3xl leading-tight">
              {form.nome || (loading ? "Carregando..." : "Nome não informado")}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">
              {form.email || (loading ? "Sincronizando e-mail..." : "E-mail não informado")}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 mt-1">
              <Badge variant="outline" className="px-1.5 bg-purple-100 text-purple-700 border-purple-200 text-xs dark:border-primary/40 dark:bg-primary/10 dark:text-primary-foreground">
                <span className="mr-1 size-1.5 rounded-full bg-purple-500 inline-block" />
                {getRoleLabel(perfil.role)}
              </Badge>
              <Badge
                variant="outline"
                className={`px-1.5 text-xs ${perfil.ativo
                  ? "bg-green-100 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
                  : "bg-red-100 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                  }`}
              >
                <span className={`mr-1 size-1.5 rounded-full inline-block ${perfil.ativo ? "bg-green-500" : "bg-red-500"}`} />
                {perfil.ativo ? "Ativo" : "Inativo"}
              </Badge>
              <Badge variant="outline" className="px-1.5 text-muted-foreground text-xs">
                {getEspecialidadeLabel(perfil)}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="responsivo h-[35px]! w-full  max-w-full flex-wrap justify-start sm:w-fit">
            <TabsTrigger value="dados" className="min-w-0 gap-1.5 ">
              <UserIcon className="size-3.5" /> Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="min-w-0 gap-1.5">
              <LockIcon className="size-3.5" /> Segurança
            </TabsTrigger>
            {podeVerMinhaAtividade ? (
              <TabsTrigger value="minha-atividade" className="min-w-0 gap-1.5">
                <ActivityIcon className="size-3.5" /> Minha atividade
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="dados" className="flex flex-col gap-4 mt-4">
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <UserIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                Informações pessoais
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nome" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Nome completo
                  </Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    disabled={loading || salvandoDados || !podeEditarIdentidade}
                    readOnly={!podeEditarIdentidade}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {podeEditarIdentidade ? "Você pode alterar este dado." : "Alterado apenas pelo administrador."}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">
                    E-mail corporativo
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      disabled
                      readOnly
                      className="pr-10 opacity-60 cursor-not-allowed"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Para mudar o E-mail, entre em contato com o administrador.
                  </p>
                </div>

                {/*
                 <div className="flex flex-col gap-1.5">
                  <Label htmlFor="perfil" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Cargo / Perfil
                  </Label>
                  {podeEditarIdentidade ? (
                    <Select
                      value={form.role || "ADMIN"}
                      onValueChange={(value) => setForm((p) => ({ ...p, role: value }))}
                      disabled={loading || salvandoDados}
                    >
                      <SelectTrigger id="perfil" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="TECNICO">Tecnico</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="perfil" value={getRoleLabel(perfil.role)} disabled readOnly />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {podeEditarIdentidade ? "Você pode alterar este dado." : "Alterado apenas pelo administrador."}
                  </p>
                </div> 
                */}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="telefone" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Número de contato
                  </Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    disabled={loading || salvandoDados}
                    onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {podeEditarIdentidade ? "Você pode alterar este dado." : "Alterado apenas pelo administrador."}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="especialidade" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Especialidade
                  </Label>
                  <Input
                    id="especialidade"
                    value={form.especialidade}
                    disabled={loading || salvandoDados}
                    onChange={(e) => setForm((p) => ({ ...p, especialidade: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  className="cursor-pointer w-full sm:w-auto"
                  disabled={loading || salvandoDados}
                  onClick={() => setForm(getFormFromPerfil(perfil))}
                >
                  Cancelar
                </Button>
                <Button className="cursor-pointer w-full sm:w-auto" disabled={loading || salvandoDados} onClick={salvarDados}>
                  {salvandoDados ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldCheckIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                Informações da conta
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <CalendarIcon className="size-3" /> Data de cadastro
                  </span>
                  <span className="text-sm font-medium">{formatDateTime(perfil.criadoEm)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ClockIcon className="size-3" /> Última atualização
                  </span>
                  <span className="text-sm font-medium">{formatDateTime(perfil.atualizadoEm)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                  <Badge
                    variant="outline"
                    className={`px-1.5 w-fit mt-0.5 ${perfil.ativo
                      ? "bg-green-100 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
                      : "bg-red-100 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                      }`}
                  >
                    <span className={`mr-1 size-1.5 rounded-full inline-block ${perfil.ativo ? "bg-green-500" : "bg-red-500"}`} />
                    {perfil.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seguranca" className="mt-4">
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4 w-full max-w-md">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <LockIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                Alterar senha
              </div>

              {senhaEtapa === "solicitar" ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Confirme sua senha atual e informe o e-mail que deve receber o código.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="senha-atual" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Senha atual
                    </Label>
                    <Input
                      id="senha-atual"
                      type="password"
                      placeholder="********"
                      autoComplete="current-password"
                      value={senhas.atual}
                      disabled={salvandoSenha}
                      onChange={(e) => setSenhas((p) => ({ ...p, atual: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="senha-email-destino" className="text-xs text-muted-foreground uppercase tracking-wide">
                      E-mail de destino
                    </Label>
                    <Input
                      id="senha-email-destino"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="destino@empresa.com"
                      value={senhas.emailDestino}
                      disabled={salvandoSenha}
                      onChange={(e) => setSenhas((p) => ({ ...p, emailDestino: e.target.value.trim() }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">
                    Digite o código enviado para {senhas.emailDestino || "o e-mail informado"} e escolha a nova senha.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="senha-codigo-0" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Código recebido
                    </Label>
                    <OtpCodeInput
                      idPrefix="senha-codigo"
                      value={senhas.codigo}
                      disabled={salvandoSenha}
                      onChange={(value) => setSenhas((p) => ({ ...p, codigo: value }))}
                      aria-label="Código recebido"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">Digite exatamente 6 números.</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="senha-nova" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Nova senha
                    </Label>
                    <Input
                      id="senha-nova"
                      type="password"
                      autoComplete="new-password"
                      placeholder="7+ caracteres, letras e número"
                      value={senhas.nova}
                      disabled={salvandoSenha}
                      onChange={(e) => setSenhas((p) => ({ ...p, nova: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="senha-confirmar" className="text-xs text-muted-foreground uppercase tracking-wide">
                      Confirmar nova senha
                    </Label>
                    <Input
                      id="senha-confirmar"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                      value={senhas.confirmar}
                      disabled={salvandoSenha}
                      onChange={(e) => setSenhas((p) => ({ ...p, confirmar: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  className="cursor-pointer w-full sm:w-auto"
                  disabled={salvandoSenha}
                  onClick={resetarFormularioSenha}
                >
                  Cancelar
                </Button>
                <Button className="w-full sm:w-auto" disabled={salvandoSenha} onClick={salvarSenha}>
                  {senhaEtapa === "confirmar"
                    ? salvandoSenha ? "Confirmando..." : "Confirmar senha"
                    : salvandoSenha ? "Enviando..." : "Enviar código"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {podeVerMinhaAtividade ? (
            <TabsContent value="minha-atividade" className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total de atendimentos", value: meusAtendimentos.length, icon: ClipboardListIcon, tone: "text-[#5E17EB] bg-purple-50 dark:bg-primary/10 dark:text-primary" },
                  { label: "Em andamento", value: atendimentosEmAndamento.length, icon: WrenchIcon, tone: "text-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-300" },
                  { label: "Resolvidos hoje", value: resolvidosHoje, icon: CircleCheckIcon, tone: "text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-300" },
                  { label: "Máquinas atendidas", value: maquinasAtendidas, icon: ActivityIcon, tone: "text-sky-700 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-300" },
                ].map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-bold text-[#5E17EB] dark:text-white">{value}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                      </div>
                      <span className={`inline-flex size-9 items-center justify-center rounded-lg ${tone}`}>
                        <Icon className="size-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="rounded-xl border bg-card p-4 sm:p-5">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <WrenchIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                    Em andamento agora
                  </div>
                  <Separator className="my-4" />

                  <div className="flex flex-col gap-3">
                    {atendimentosEmAndamento.length > 0 ? (
                      atendimentosEmAndamento.slice(0, 4).map((alerta) => (
                        <button
                          key={alerta.id}
                          type="button"
                          className="flex cursor-pointer flex-col gap-2 rounded-lg border bg-muted/15 px-3 py-3 text-left transition-colors hover:border-[#5E17EB]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E17EB]/30"
                          onClick={() => abrirDetalhesAtendimento(alerta)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{alerta.maquinaNome}</p>
                              <p className="truncate text-xs text-muted-foreground">{alerta.sensorNome}</p>
                            </div>
                            <StatusAlertaBadge value={alerta.status} />
                          </div>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{alerta.mensagem}</p>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                        Nenhum atendimento em andamento agora.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <ActivityIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                      Todos os meus atendimentos
                    </div>
                    <Badge variant="outline" className="text-muted-foreground">
                      {alertasStatus === "loading" ? "Atualizando" : `${meusAtendimentos.length} registro(s)`}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-3 md:hidden">
                    {meusAtendimentos.length > 0 ? (
                      meusAtendimentos.map((alerta) => (
                        <AtendimentoMobileCard
                          key={alerta.id}
                          alerta={alerta}
                          onOpen={abrirDetalhesAtendimento}
                        />
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                        Nenhum atendimento vinculado ao seu usuário ainda.
                      </div>
                    )}
                  </div>

                  <div className="hidden min-h-[360px] overflow-auto rounded-lg border bg-card md:block dark:border-gray-700! dark:bg-[#0F172A]">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-muted">
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Máquina</TableHead>
                          <TableHead className="whitespace-nowrap">Tipo</TableHead>
                          <TableHead className="whitespace-nowrap">Data</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {meusAtendimentos.length > 0 ? (
                          meusAtendimentos.map((alerta) => (
                            <TableRow
                              key={alerta.id}
                              className="cursor-pointer"
                              onClick={() => abrirDetalhesAtendimento(alerta)}
                            >
                              <TableCell className="font-medium text-sm whitespace-nowrap">
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate">{alerta.maquinaNome}</span>
                                  <span className="truncate text-xs font-normal text-muted-foreground">{alerta.sensorNome}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatAlertType(alerta.tipo)}</TableCell>
                              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDateTime(getAlertDate(alerta))}</TableCell>
                              <TableCell><StatusAlertaBadge value={alerta.status} /></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                              Nenhum atendimento vinculado ao seu usuário ainda.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          ) : null}
        </Tabs>

        <Sheet open={Boolean(atendimentoSelecionado)} onOpenChange={(open) => !open && setAtendimentoSelecionado(null)}>
          <SheetContent side="right" mobileSide="bottom" className="w-full max-w-none! gap-0 overflow-hidden sm:w-[560px]! sm:max-w-none!">
            {atendimentoDetalhado ? (
              <>
                <SheetHeader className="shrink-0">
                  <SheetTitle>Detalhes do atendimento</SheetTitle>
                  <SheetDescription>{atendimentoDetalhado.sensorNome}</SheetDescription>
                </SheetHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
                  <div className="rounded-xl border bg-linear-to-br from-primary/10 via-card to-card p-4 shadow-sm dark:border-gray-700! dark:bg-[#0F172A]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xl font-semibold leading-tight text-foreground">{atendimentoDetalhado.maquinaNome}</p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{atendimentoDetalhado.sensorNome}</p>
                      </div>
                      <StatusAlertaBadge value={atendimentoDetalhado.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-purple-200 bg-purple-50 px-1.5 text-xs font-normal text-[#3B2867] dark:border-primary/40 dark:bg-primary/10 dark:text-primary-foreground">
                        {formatAlertType(atendimentoDetalhado.tipo)}
                      </Badge>
                      <Badge variant="outline" className="px-1.5 text-muted-foreground">
                        {Math.max(Number(atendimentoDetalhado.ocorrencias) || 1, 1)} ocorr.
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Mensagem</Label>
                    <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm leading-relaxed text-foreground">{atendimentoDetalhado.mensagem}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-card p-3 shadow-xs">
                      <span className="text-xs text-muted-foreground">Última ocorrência</span>
                      <p className="mt-1 text-sm font-semibold text-[#3B2867] dark:text-white">
                        {formatDateTime(getAlertDate(atendimentoDetalhado))}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card p-3 shadow-xs">
                      <span className="text-xs text-muted-foreground">Ocorrências</span>
                      <p className="mt-1 text-sm font-semibold text-[#3B2867] dark:text-white">
                        {Math.max(Number(atendimentoDetalhado.ocorrencias) || 1, 1)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card p-3 shadow-xs">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <p className="mt-1 text-sm font-semibold text-[#3B2867] dark:text-white">
                        {atendimentoDetalhado.status === "RESOLVIDO" ? "Resolvido" : atendimentoDetalhado.status === "EM_ANDAMENTO" ? "Em andamento" : atendimentoDetalhado.status}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card p-3 shadow-xs">
                      <span className="text-xs text-muted-foreground">Técnico</span>
                      <p className="mt-1 truncate text-sm font-semibold text-[#3B2867] dark:text-white">
                        {atendimentoDetalhado.tecnicoNome || perfil.nome || "Não informado"}
                      </p>
                    </div>
                  </div>
                </div>

                <SheetFooter className="shrink-0 border-t border-border/70 bg-popover/95 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)]">
                  <Button variant="outline" className="w-full cursor-pointer" onClick={() => setAtendimentoSelecionado(null)}>
                    Fechar
                  </Button>
                </SheetFooter>
              </>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
      <ProfilePhotoCropDialog
        file={fotoParaAjustar}
        open={Boolean(fotoParaAjustar)}
        onCancel={() => setFotoParaAjustar(null)}
        onConfirm={enviarFoto}
      />
    </>
  )
}
