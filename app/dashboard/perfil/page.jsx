"use client"

import * as React from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SiteHeader } from "@/components/site-header"
import {
  UserIcon,
  LockIcon,
  ActivityIcon,
  CameraIcon,
  CircleCheckIcon,
  AlertTriangleIcon,
  WrenchIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "lucide-react"

// ─── Dados mock do usuário logado ─────────────────────────────────────────────
// Substitua por dados vindos do contexto de autenticação / API
const USUARIO_MOCK = {
  nome: "Henrique Berdoldi Fiorotti",
  email: "henrique.berdoldi.1@orbis.com.br",
  perfil: "Técnico",
  setor: "Setor A - Produção",
  telefone: "11 91107-4549",
  especialidade: "Torno CNC, Bosta Automática",
  status: "ATIVO",
  dataCadastro: "12 de Janeiro, 2026",
  ultimoLogin: "Hoje, 08:49",
}

const MAQUINAS_MOCK = [
  { id: 1, nome: "Motor Esteira A-01", setor: "Setor A — Expedição", criticidade: "ALTA", status: "OK" },
  { id: 2, nome: "Compressor B-03", setor: "Setor B — Produção", criticidade: "MEDIA", status: "ALERTA" },
  { id: 3, nome: "Torno CNC C-07", setor: "Setor C — Utilidades", criticidade: "BAIXA", status: "OK" },
]

const ALERTAS_MOCK = [
  { id: 1, maquina: "Motor Esteira A-01", tipo: "Temperatura", data: "01/04/2026 · 14:22", status: "RESOLVIDO" },
  { id: 2, maquina: "Compressor B-03", tipo: "Vibração", data: "30/03/2026 · 09:55", status: "RESOLVIDO" },
  { id: 3, maquina: "Compressor B-03", tipo: "Tendência", data: "28/03/2026 · 17:08", status: "EM_ANDAMENTO" },
  { id: 4, maquina: "Torno CNC C-07", tipo: "Temperatura", data: "25/03/2026 · 11:30", status: "RESOLVIDO" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getIniciais(nome) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

function CriticidadeBadge({ value }) {
  const styles = {
    ALTA: "bg-red-100 text-red-700 border-red-200",
    MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200",
    BAIXA: "bg-green-100 text-green-700 border-green-200",
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
      {value === "OK"
        ? <CircleCheckIcon className="fill-[#5E17EB]!" />
        : <AlertTriangleIcon className="text-red-500" />}
      {value}
    </Badge>
  )
}

function StatusAlertaBadge({ value }) {
  if (value === "RESOLVIDO")
    return <Badge variant="outline" className="px-1.5 bg-green-100 text-green-700 border-green-200">Resolvido</Badge>
  if (value === "EM_ANDAMENTO")
    return <Badge variant="outline" className="px-1.5 bg-yellow-100 text-yellow-700 border-yellow-200">Em andamento</Badge>
  return <Badge variant="outline" className="px-1.5">{value}</Badge>
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PerfilPage() {
  const [form, setForm] = React.useState({
    nome: USUARIO_MOCK.nome,
    email: USUARIO_MOCK.email,
    telefone: USUARIO_MOCK.telefone,
    especialidade: USUARIO_MOCK.especialidade,
    setor: USUARIO_MOCK.setor,
  })

  const [senhas, setSenhas] = React.useState({
    atual: "",
    nova: "",
    confirmar: "",
  })

  function salvarDados() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios.")
      return
    }
    toast.success("Dados atualizados com sucesso!")
  }

  function salvarSenha() {
    if (!senhas.atual || !senhas.nova || !senhas.confirmar) {
      toast.error("Preencha todos os campos de senha.")
      return
    }
    if (senhas.nova !== senhas.confirmar) {
      toast.error("A nova senha e a confirmação não coincidem.")
      return
    }
    if (senhas.nova.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }
    toast.success("Senha alterada com sucesso!")
    setSenhas({ atual: "", nova: "", confirmar: "" })
  }

  const alertasResolvidos = ALERTAS_MOCK.filter((a) => a.status === "RESOLVIDO").length
  const alertasEmAndamento = ALERTAS_MOCK.filter((a) => a.status === "EM_ANDAMENTO").length

  return (
    <>
      <SiteHeader />

      <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">

        {/* Cabeçalho da página */}
        <div>
          <h1 className="text-xl font-semibold">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações pessoais e preferências de conta.
          </p>
        </div>

        <Separator />

        {/* ── Card de identificação ── */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-10 sm:gap-10 rounded-xl border bg-card p-5">
          {/* Avatar */}
          <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-30 lg:h-30">
            <Avatar className="size-full! text-lg font-bold">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-[#5E17EB] text-white text-xl sm:text-2xl lg:text-3xl font-bold">
                {getIniciais(form.nome)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => toast.info("Upload de foto em breve.")}
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#5E17EB] text-white border-2 border-background hover:bg-[#4c11cc] transition-colors"
            >
              <CameraIcon className="size-3" />
            </button>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1 text-start sm:text-left">
            <p className="font-semibold m-0 text-xl sm:text-2xl lg:text-3xl leading-tight">
              {form.nome}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">{form.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 mt-1">
              <Badge variant="outline" className="px-1.5 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                <span className="mr-1 size-1.5 rounded-full bg-purple-500 inline-block" />
                {USUARIO_MOCK.perfil}
              </Badge>
              <Badge variant="outline" className="px-1.5 bg-green-100 text-green-700 border-green-200 text-xs">
                <span className="mr-1 size-1.5 rounded-full bg-green-500 inline-block" />
                Ativo
              </Badge>
              <Badge variant="outline" className="px-1.5 text-muted-foreground text-xs">
                {USUARIO_MOCK.setor}
              </Badge>
            </div>
          </div>
        </div>

        {/* ── Abas ── */}
        <Tabs defaultValue="dados">
          <TabsList className="responsivo w-50  h-auto justify-start ">
            <TabsTrigger value="dados" className="gap-1.5 ">
              <UserIcon className="size-3.5" /> Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-1.5 ">
              <LockIcon className="size-3.5" /> Segurança
            </TabsTrigger>
            <TabsTrigger value="atividade" className="gap-1.5 ">
              <ActivityIcon className="size-3.5" /> Atividade
            </TabsTrigger>
          </TabsList>

          {/* ──────────────────────────────────────────
              ABA 1 — DADOS PESSOAIS
          ────────────────────────────────────────── */}
          <TabsContent value="dados" className="flex flex-col gap-4 mt-4 ">

            {/* Informações pessoais */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <UserIcon className="size-4 text-[#5E17EB]" />
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
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Cargo / Perfil
                  </Label>
                  <Input value={USUARIO_MOCK.perfil} disabled />
                  <p className="text-xs text-muted-foreground">Alterado apenas pelo administrador.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="telefone" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Número de contato
                  </Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
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
                    onChange={(e) => setForm((p) => ({ ...p, especialidade: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="setor" className="text-xs text-muted-foreground uppercase tracking-wide">
                    Setor / Departamento
                  </Label>
                  <Input
                    id="setor"
                    value={form.setor}
                    onChange={(e) => setForm((p) => ({ ...p, setor: e.target.value }))}
                  />
                </div>
              </div>

              {/* Botões: empilhados no mobile, lado a lado no desktop */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setForm({
                    nome: USUARIO_MOCK.nome,
                    email: USUARIO_MOCK.email,
                    telefone: USUARIO_MOCK.telefone,
                    especialidade: USUARIO_MOCK.especialidade,
                    setor: USUARIO_MOCK.setor,
                  })}
                >
                  Cancelar
                </Button>
                <Button className="w-full sm:w-auto" onClick={salvarDados}>
                  Salvar alterações
                </Button>
              </div>
            </div>

            {/* Informações da conta */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldCheckIcon className="size-4 text-[#5E17EB]" />
                Informações da conta
              </div>

              {/* Grid: 1 col mobile → 3 colunas sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <CalendarIcon className="size-3" /> Data de cadastro
                  </span>
                  <span className="text-sm font-medium">{USUARIO_MOCK.dataCadastro}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ClockIcon className="size-3" /> Último login
                  </span>
                  <span className="text-sm font-medium">{USUARIO_MOCK.ultimoLogin}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                  <Badge variant="outline" className="px-1.5 bg-green-100 text-green-700 border-green-200 w-fit mt-0.5">
                    <span className="mr-1 size-1.5 rounded-full bg-green-500 inline-block" />
                    Ativo
                  </Badge>
                </div>
              </div>
            </div>

          </TabsContent>

          {/* ──────────────────────────────────────────
   ABA 2 — SEGURANÇA
────────────────────────────────────────── */}
          <TabsContent value="seguranca" className="mt-4">
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-4 w-full max-w-md">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <LockIcon className="size-4 text-[#5E17EB]" />
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
                    placeholder="••••••••"
                    value={senhas.atual}
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
                    placeholder="Mínimo 8 caracteres"
                    value={senhas.nova}
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
                    onChange={(e) => setSenhas((p) => ({ ...p, confirmar: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setSenhas({ atual: "", nova: "", confirmar: "" })}
                >
                  Cancelar
                </Button>
                <Button className="w-full sm:w-auto" onClick={salvarSenha}>
                  Alterar senha
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ──────────────────────────────────────────
   ABA 3 — ATIVIDADE
────────────────────────────────────────── */}
          <TabsContent value="atividade" className="flex flex-col gap-4 mt-4">

            {/* Estatísticas: 1 col mobile → 3 colunas sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Alertas resolvidos este mês", value: alertasResolvidos },
                { label: "Máquinas sob responsabilidade", value: MAQUINAS_MOCK.length },
                { label: "Alertas em andamento", value: alertasEmAndamento },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border bg-card p-4">
                  <p className="text-2xl font-bold text-[#5E17EB]">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Máquinas responsáveis */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <WrenchIcon className="size-4 text-[#5E17EB]" />
                Máquinas sob responsabilidade
              </div>

              <div className="flex flex-col gap-2">
                {MAQUINAS_MOCK.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border px-4 py-3 hover:border-[#5E17EB]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-[#5E17EB]">
                        <WrenchIcon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.nome}</p>
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                          {m.setor} · <CriticidadeBadge value={m.criticidade} />
                        </p>
                      </div>
                    </div>
                    {/* Badge alinhado à esquerda no mobile (recuado sob o ícone) */}
                    <div className="pl-12 sm:pl-0">
                      <StatusMaquinaBadge value={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Histórico de alertas — scroll horizontal em telas pequenas */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ActivityIcon className="size-4 text-[#5E17EB]" />
                Histórico de alertas atendidos
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Máquina</TableHead>
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