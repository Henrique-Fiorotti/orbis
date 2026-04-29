"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { SiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { clearAuthSession, getAuthSession, updateAuthSessionUser } from "@/lib/auth-session"
import { getHttpErrorStatus, requestDashboardJson } from "@/lib/dashboard-api"
import {
  ActivityIcon,
  AlertTriangleIcon,
  CalendarIcon,
  CameraIcon,
  CircleCheckIcon,
  ClockIcon,
  LockIcon,
  ShieldCheckIcon,
  UserIcon,
  WrenchIcon,
} from "lucide-react"

const EMPTY_FORM = {
  nome: "",
  email: "",
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
  criadoEm: null,
  atualizadoEm: null,
}

const MAQUINAS_MOCK = [
  { id: 1, nome: "Motor Esteira A-01", setor: "Setor A - Expedicao", criticidade: "ALTA", status: "OK" },
  { id: 2, nome: "Compressor B-03", setor: "Setor B - Producao", criticidade: "MEDIA", status: "ALERTA" },
  { id: 3, nome: "Torno CNC C-07", setor: "Setor C - Utilidades", criticidade: "BAIXA", status: "OK" },
]

const ALERTAS_MOCK = [
  { id: 1, maquina: "Motor Esteira A-01", tipo: "Temperatura", data: "01/04/2026 - 14:22", status: "RESOLVIDO" },
  { id: 2, maquina: "Compressor B-03", tipo: "Vibracao", data: "30/03/2026 - 09:55", status: "RESOLVIDO" },
  { id: 3, maquina: "Compressor B-03", tipo: "Tendencia", data: "28/03/2026 - 17:08", status: "EM_ANDAMENTO" },
  { id: 4, maquina: "Torno CNC C-07", tipo: "Temperatura", data: "25/03/2026 - 11:30", status: "RESOLVIDO" },
]

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
    email: normalizeString(source.email),
    role: normalizeString(source.role),
    ativo: typeof source.ativo === "boolean" ? source.ativo : true,
    telefone: normalizeString(source.telefone),
    especialidade: normalizeString(source.especialidade),
    criadoEm: normalizeString(source.criadoEm, null),
    atualizadoEm: normalizeString(source.atualizadoEm, null),
  }
}

function getFormFromPerfil(perfil) {
  return {
    nome: perfil.nome,
    email: perfil.email,
    telefone: perfil.telefone,
    especialidade: perfil.especialidade,
  }
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
  if (role === "TECNICO") return "Tecnico"
  return role || "Perfil nao informado"
}

function formatDateTime(value) {
  if (!value) {
    return "Nao informado"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Nao informado"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
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

export default function PerfilPage() {
  const router = useRouter()
  const [perfil, setPerfil] = React.useState(EMPTY_PERFIL)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [status, setStatus] = React.useState("loading")
  const [mensagem, setMensagem] = React.useState("Carregando perfil...")
  const [salvandoDados, setSalvandoDados] = React.useState(false)
  const [salvandoSenha, setSalvandoSenha] = React.useState(false)
  const [senhas, setSenhas] = React.useState({
    atual: "",
    nova: "",
    confirmar: "",
  })

  const loading = status === "loading"
  const alertasResolvidos = ALERTAS_MOCK.filter((a) => a.status === "RESOLVIDO").length
  const alertasEmAndamento = ALERTAS_MOCK.filter((a) => a.status === "EM_ANDAMENTO").length

  React.useEffect(() => {
    let isActive = true

    async function carregarPerfil() {
      const session = getAuthSession()

      if (!session?.accessToken) {
        setStatus("error")
        setMensagem("Faca login para carregar o perfil.")
        return
      }

      setStatus("loading")
      setMensagem("Carregando perfil...")

      try {
        const payload = await requestDashboardJson("/perfil", session.accessToken, "o perfil")
        const nextPerfil = normalizePerfil(payload)

        if (!isActive) {
          return
        }

        setPerfil(nextPerfil)
        setForm(getFormFromPerfil(nextPerfil))
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
        setMensagem(getErrorMessage(error, "Nao foi possivel carregar o perfil."))
      }
    }

    carregarPerfil()

    return () => {
      isActive = false
    }
  }, [router])

  async function salvarDados() {
    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faca login para atualizar o perfil.")
      return
    }

    setSalvandoDados(true)

    try {
      const payload = await requestDashboardJson("/perfil", session.accessToken, "a atualizacao do perfil", {
        method: "PUT",
        body: {
          telefone: form.telefone.trim(),
          especialidade: form.especialidade.trim(),
        },
      })
      const nextPerfil = normalizePerfil({ ...perfil, ...payload })

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

      toast.error(getErrorMessage(error, "Nao foi possivel atualizar o perfil."))
    } finally {
      setSalvandoDados(false)
    }
  }

  async function salvarSenha() {
    if (!senhas.atual || !senhas.nova || !senhas.confirmar) {
      toast.error("Preencha todos os campos de senha.")
      return
    }
    if (senhas.nova !== senhas.confirmar) {
      toast.error("A nova senha e a confirmacao nao coincidem.")
      return
    }
    if (senhas.nova.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      toast.error("Faca login para alterar a senha.")
      return
    }

    setSalvandoSenha(true)

    try {
      await requestDashboardJson("/perfil/senha", session.accessToken, "a alteracao de senha", {
        method: "PUT",
        body: {
          senhaAtual: senhas.atual,
          novaSenha: senhas.nova,
        },
      })

      toast.success("Senha alterada com sucesso!")
      setSenhas({ atual: "", nova: "", confirmar: "" })
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
        router.replace("/")
        return
      }

      toast.error(getErrorMessage(error, "Nao foi possivel alterar a senha."))
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <>
      <SiteHeader />

      <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
        <div>
          <h1 className="text-xl font-semibold">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informacoes pessoais e preferencias de conta.
          </p>
        </div>

        <Separator />

        {mensagem ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === "error"
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
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-[#5E17EB] text-white text-xl sm:text-2xl lg:text-3xl font-bold">
                {getIniciais(form.nome)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => toast.info("Upload de foto em breve.")}
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#5E17EB] text-white border-2 border-background hover:bg-[#4c11cc] transition-colors"
            >
              <CameraIcon className="size-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-start sm:text-left">
            <p className="font-semibold m-0 text-xl sm:text-2xl lg:text-3xl leading-tight">
              {form.nome || (loading ? "Carregando..." : "Nome nao informado")}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">
              {form.email || (loading ? "Sincronizando e-mail..." : "E-mail nao informado")}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 mt-1">
              <Badge variant="outline" className="px-1.5 bg-purple-100 text-purple-700 border-purple-200 text-xs dark:border-primary/40 dark:bg-primary/10 dark:text-primary-foreground">
                <span className="mr-1 size-1.5 rounded-full bg-purple-500 inline-block" />
                {getRoleLabel(perfil.role)}
              </Badge>
              <Badge
                variant="outline"
                className={`px-1.5 text-xs ${
                  perfil.ativo
                    ? "bg-green-100 text-green-700 border-green-200 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 border-red-200 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                }`}
              >
                <span className={`mr-1 size-1.5 rounded-full inline-block ${perfil.ativo ? "bg-green-500" : "bg-red-500"}`} />
                {perfil.ativo ? "Ativo" : "Inativo"}
              </Badge>
              <Badge variant="outline" className="px-1.5 text-muted-foreground text-xs">
                {perfil.especialidade || "Sem especialidade"}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dados">
          <TabsList className="responsivo w-50 h-auto justify-start">
            <TabsTrigger value="dados" className="gap-1.5">
              <UserIcon className="size-3.5" /> Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-1.5">
              <LockIcon className="size-3.5" /> Seguranca
            </TabsTrigger>
            <TabsTrigger value="atividade" className="gap-1.5">
              <ActivityIcon className="size-3.5" /> Atividade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="flex flex-col gap-4 mt-4">
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <UserIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                Informacoes pessoais
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nome" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Nome completo
                  </Label>
                  <Input id="nome" value={form.nome} disabled readOnly />
                  <p className="text-xs text-muted-foreground">Alterado apenas pelo administrador.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">
                    E-mail corporativo
                  </Label>
                  <Input id="email" type="email" value={form.email} disabled readOnly />
                  <p className="text-xs text-muted-foreground">Alterado apenas pelo administrador.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="perfil" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Cargo / Perfil
                  </Label>
                  <Input id="perfil" value={getRoleLabel(perfil.role)} disabled readOnly />
                  <p className="text-xs text-muted-foreground">Alterado apenas pelo administrador.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="telefone" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Numero de contato
                  </Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    disabled={loading || salvandoDados}
                    onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                  />
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
                  className="w-full sm:w-auto"
                  disabled={loading || salvandoDados}
                  onClick={() => setForm(getFormFromPerfil(perfil))}
                >
                  Cancelar
                </Button>
                <Button className="w-full sm:w-auto" disabled={loading || salvandoDados} onClick={salvarDados}>
                  {salvandoDados ? "Salvando..." : "Salvar alteracoes"}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldCheckIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                Informacoes da conta
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
                    <ClockIcon className="size-3" /> Ultima atualizacao
                  </span>
                  <span className="text-sm font-medium">{formatDateTime(perfil.atualizadoEm)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                  <Badge
                    variant="outline"
                    className={`px-1.5 w-fit mt-0.5 ${
                      perfil.ativo
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

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="senha-atual" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Senha atual
                  </Label>
                  <Input
                    id="senha-atual"
                    type="password"
                    placeholder="********"
                    value={senhas.atual}
                    disabled={salvandoSenha}
                    onChange={(e) => setSenhas((p) => ({ ...p, atual: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="senha-nova" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Nova senha
                  </Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    placeholder="Minimo 8 caracteres"
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
                    placeholder="Repita a nova senha"
                    value={senhas.confirmar}
                    disabled={salvandoSenha}
                    onChange={(e) => setSenhas((p) => ({ ...p, confirmar: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={salvandoSenha}
                  onClick={() => setSenhas({ atual: "", nova: "", confirmar: "" })}
                >
                  Cancelar
                </Button>
                <Button className="w-full sm:w-auto" disabled={salvandoSenha} onClick={salvarSenha}>
                  {salvandoSenha ? "Alterando..." : "Alterar senha"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="atividade" className="flex flex-col gap-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Alertas resolvidos este mes", value: alertasResolvidos },
                { label: "Maquinas sob responsabilidade", value: MAQUINAS_MOCK.length },
                { label: "Alertas em andamento", value: alertasEmAndamento },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border bg-card p-4">
                  <p className="text-2xl font-bold text-[#5E17EB] dark:text-white">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <WrenchIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                Maquinas sob responsabilidade
              </div>

              <div className="flex flex-col gap-2">
                {MAQUINAS_MOCK.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border px-4 py-3 hover:border-[#5E17EB]/40 dark:hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[#5E17EB] dark:bg-primary/10 dark:text-primary">
                        <WrenchIcon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.nome}</p>
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                          {m.setor} - <CriticidadeBadge value={m.criticidade} />
                        </p>
                      </div>
                    </div>
                    <div className="pl-12 sm:pl-0">
                      <StatusMaquinaBadge value={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ActivityIcon className="size-4 text-[#5E17EB] dark:text-primary" />
                Historico de alertas atendidos
              </div>

              <div className="min-h-[300px] overflow-auto rounded-lg border bg-card dark:border-gray-700! dark:bg-[#0F172A]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Maquina</TableHead>
                      <TableHead className="whitespace-nowrap">Tipo</TableHead>
                      <TableHead className="whitespace-nowrap">Data</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ALERTAS_MOCK.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm whitespace-nowrap">{a.maquina}</TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{a.tipo}</TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{a.data}</TableCell>
                        <TableCell><StatusAlertaBadge value={a.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
