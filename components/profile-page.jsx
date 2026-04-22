"use client"

import * as React from "react"
import { toast } from "sonner"
import { ArrowLeftIcon, CalendarIcon, ClockIcon, LockIcon, ShieldCheckIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { formatRoleLabel, getUserInitials } from "@/lib/user-models"

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "TECNICO", label: "Tecnico" },
]

const STATUS_OPTIONS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
]

function createFormState(profile) {
  return {
    nome: profile?.nome || "",
    email: profile?.email || "",
    telefone: profile?.telefone || "",
    especialidade: profile?.especialidade || "",
    setor: profile?.setor || "",
    status: profile?.status || "ATIVO",
    role: profile?.role || "TECNICO",
    foto: profile?.foto || "",
  }
}

function formatDateLabel(value, { includeTime = false, fallback = "Nao informado" } = {}) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : fallback
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date)
}

export function ProfilePage({
  title,
  description,
  profile,
  loading = false,
  saving = false,
  errorMessage = "",
  canEditRole = false,
  canEditStatus = false,
  onSave,
  onDelete,
  onBack,
}) {
  const [form, setForm] = React.useState(() => createFormState(profile))

  React.useEffect(() => {
    setForm(createFormState(profile))
  }, [profile])

  const roleLabel = formatRoleLabel(form.role)
  const statusLabel = form.status === "ATIVO" ? "Ativo" : "Inativo"

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Nome e e-mail sao obrigatorios.")
      return
    }

    if (!onSave) {
      return
    }

    await onSave(form)
  }

  async function handleDelete() {
    if (!onDelete) {
      return
    }

    await onDelete()
  }

  function handleReset() {
    setForm(createFormState(profile))
  }

  const isBusy = loading || saving

  return (
    <>
      <SiteHeader />

      <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {onBack ? (
              <Button variant="ghost" size="icon-sm" onClick={onBack} className="mt-0.5">
                <ArrowLeftIcon className="size-4" />
              </Button>
            ) : null}

            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}

        <Separator />

        {loading && !profile ? (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Carregando perfil...
          </div>
        ) : null}

        {!loading && !profile ? (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Nao foi possivel carregar os dados deste perfil.
          </div>
        ) : null}

        {profile ? (
          <>
            <div className="flex flex-col sm:flex-row items-center gap-10 rounded-xl border bg-card p-5">
              <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-30 lg:h-30">
                <Avatar className="size-full text-lg font-bold">
                  <AvatarImage src={form.foto || undefined} />
                  <AvatarFallback className="bg-[#5E17EB] text-white text-xl sm:text-2xl lg:text-3xl font-bold">
                    {getUserInitials(form.nome)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col gap-1 text-start sm:text-left">
                <p className="font-semibold m-0 text-xl sm:text-2xl lg:text-3xl leading-tight">
                  {form.nome}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">{form.email}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="px-1.5 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                    <span className="mr-1 size-1.5 rounded-full bg-purple-500 inline-block" />
                    {roleLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`px-1.5 text-xs ${
                      form.status === "ATIVO"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    <span
                      className={`mr-1 size-1.5 rounded-full inline-block ${
                        form.status === "ATIVO" ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                    {statusLabel}
                  </Badge>
                  {form.setor ? (
                    <Badge variant="outline" className="px-1.5 text-muted-foreground text-xs">
                      {form.setor}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <Tabs defaultValue="dados">
              <TabsList className="responsivo w-50 h-auto justify-start">
                <TabsTrigger value="dados" className="gap-1.5">
                  <UserIcon className="size-3.5" /> Dados pessoais
                </TabsTrigger>
                <TabsTrigger value="seguranca" className="gap-1.5">
                  <LockIcon className="size-3.5" /> Seguranca
                </TabsTrigger>
                <TabsTrigger value="atividade" className="gap-1.5">
                  <ShieldCheckIcon className="size-3.5" /> Resumo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="flex flex-col gap-4 mt-4">
                <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <UserIcon className="size-4 text-[#5E17EB]" />
                    Informacoes pessoais
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="nome" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Nome completo
                      </Label>
                      <Input
                        id="nome"
                        value={form.nome}
                        onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                        disabled={isBusy}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        disabled={isBusy}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Cargo / Perfil
                      </Label>
                      {canEditRole ? (
                        <Select
                          value={form.role}
                          onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}
                          disabled={isBusy}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <Input value={roleLabel} disabled />
                          <p className="text-xs text-muted-foreground">A role desta conta nao pode ser alterada aqui.</p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="telefone" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Numero de contato
                      </Label>
                      <Input
                        id="telefone"
                        value={form.telefone}
                        onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
                        disabled={isBusy}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="especialidade" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Especialidade
                      </Label>
                      <Input
                        id="especialidade"
                        value={form.especialidade}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, especialidade: event.target.value }))
                        }
                        disabled={isBusy}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="setor" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Setor / Departamento
                      </Label>
                      <Input
                        id="setor"
                        value={form.setor}
                        onChange={(event) => setForm((current) => ({ ...current, setor: event.target.value }))}
                        disabled={isBusy}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                      {canEditStatus ? (
                        <Select
                          value={form.status}
                          onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}
                          disabled={isBusy}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={statusLabel} disabled />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="foto" className="text-xs text-muted-foreground uppercase tracking-wide">
                        Foto
                      </Label>
                      <Input
                        id="foto"
                        value={form.foto}
                        onChange={(event) => setForm((current) => ({ ...current, foto: event.target.value }))}
                        placeholder="https://exemplo.com/foto.jpg"
                        disabled={isBusy}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={handleReset} disabled={isBusy}>
                      Cancelar
                    </Button>
                    {onDelete ? (
                      <Button
                        variant="destructive"
                        className="w-full sm:w-auto"
                        onClick={handleDelete}
                        disabled={isBusy}
                      >
                        Excluir
                      </Button>
                    ) : null}
                    <Button className="w-full sm:w-auto" onClick={handleSave} disabled={isBusy}>
                      {saving ? "Salvando..." : "Salvar alteracoes"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShieldCheckIcon className="size-4 text-[#5E17EB]" />
                    Informacoes da conta
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <CalendarIcon className="size-3" /> Data de cadastro
                      </span>
                      <span className="text-sm font-medium">{formatDateLabel(profile.criadoEm)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <ClockIcon className="size-3" /> Ultimo login
                      </span>
                      <span className="text-sm font-medium">
                        {formatDateLabel(profile.ultimoLoginEm, { includeTime: true })}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                      <Badge
                        variant="outline"
                        className={`px-1.5 w-fit mt-0.5 ${
                          form.status === "ATIVO"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seguranca" className="mt-4">
                <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4 w-full max-w-md">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <LockIcon className="size-4 text-[#5E17EB]" />
                    Seguranca da conta
                  </div>

                  <p className="text-sm text-muted-foreground">
                    A alteracao de senha ainda nao esta integrada nesta interface. Quando a API expuser o endpoint,
                    este bloco podera usar a mesma base de sessao e `apiFetch`.
                  </p>

                  <Button variant="outline" onClick={() => toast.info("Integracao de senha pendente no backend.")}>
                    Avisar ao usuario
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="atividade" className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Alertas atendidos", value: profile.alertasAtendidos ?? 0 },
                    { label: "Perfil da conta", value: roleLabel },
                    { label: "Status atual", value: statusLabel },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border bg-card p-4">
                      <p className="text-2xl font-bold text-[#5E17EB]">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <ShieldCheckIcon className="size-4 text-[#5E17EB]" />
                    Resumo rapido
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg border p-4">
                      <p className="font-medium">Especialidade</p>
                      <p className="text-muted-foreground mt-1">{profile.especialidade || "Nao informada"}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="font-medium">Setor</p>
                      <p className="text-muted-foreground mt-1">{profile.setor || "Nao informado"}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </>
  )
}
