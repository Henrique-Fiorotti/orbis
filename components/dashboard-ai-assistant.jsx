"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  AlertTriangleIcon,
  BotIcon,
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { askDashboardAi, getHttpErrorStatus } from "@/lib/dashboard-api"
import { cn } from "@/lib/utils"

const MIN_QUESTION_LENGTH = 3
const MAX_QUESTION_LENGTH = 500

const PAGE_CONTEXTS = [
  {
    path: "/dashboard/maquinas",
    label: "Maquinas",
    description: "gestão e leitura operacional das maquinas cadastradas",
  },
  {
    path: "/dashboard/sensores",
    label: "Sensores",
    description: "monitoramento de sensores, status e últimas leituras",
  },
  {
    path: "/dashboard/alertas",
    label: "Alertas",
    description: "chamados, severidade, status e priorização de atendimento",
  },
  {
    path: "/dashboard/tecnicos",
    label: "Tecnicos",
    description: "equipe técnica, disponibilidade e cadastro de usuários técnicos",
  },
  {
    path: "/dashboard/relatorios",
    label: "Relatorios",
    description: "análises, gráficos e consolidação de indicadores",
  },
  {
    path: "/dashboard/perfil",
    label: "Perfil",
    description: "dados e preferências do usuário autenticado",
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    description: "visão geral operacional com máquinas, sensores e alertas",
  },
]

const SUGGESTED_PROMPTS = [
  {
    icon: AlertTriangleIcon,
    label: "Resumir alertas ativos",
    prompt: "Resuma os alertas ativos e diga o que precisa de atenção primeiro.",
  },
  {
    icon: SparklesIcon,
    label: "Analisar prioridades",
    prompt: "Analise o dashboard e me diga quais prioridades operacionais devo olhar agora.",
  },
  {
    icon: BotIcon,
    label: "Conferir sensores",
    prompt: "Quais sensores parecem exigir uma verificação mais cuidadosa?",
  },
  {
    icon: FileTextIcon,
    label: "Planejar proximos passos",
    prompt: "Monte uma lista curta de próximos passos para manter a operação estável hoje.",
  },
]

function createMessage(role, content, extras = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extras,
  }
}

function formatMessageTime(value) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  } catch {
    return ""
  }
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Nao foi possivel consultar a IA agora."
}

function getCurrentPageContext(pathname) {
  const normalizedPathname = pathname || "/dashboard"
  const page =
    PAGE_CONTEXTS.find((candidate) => normalizedPathname.startsWith(candidate.path)) ??
    PAGE_CONTEXTS[PAGE_CONTEXTS.length - 1]
  const search =
    typeof window !== "undefined" && window.location.search ? window.location.search : ""
  const url = `${normalizedPathname}${search}`

  return {
    id: `page:${url}`,
    label: page.label,
    text: `${page.label} (${url}): ${page.description}.`,
  }
}

function buildPromptPayload(question, contexts) {
  const lines = []

  if (contexts.length > 0) {
    lines.push(`Contexto de pagina: ${contexts.map((context) => context.text).join(" | ")}`)
  }

  lines.push(`Pergunta: ${question}`)

  return lines.join("\n")
}

function ChatMessage({ message, animate = false }) {
  const isUser = message.role === "user"
  const isError = message.role === "error"

  const { displayed, isDone } = useTypewriter(animate ? message.content : "")
  const content = animate ? displayed : message.content
  const isTyping = animate && !isDone

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[86%] rounded-[8px] border px-3 py-2 shadow-sm",
        isUser ? "border-primary/70 bg-primary text-primary-foreground"
               : "border-border bg-muted/40 text-foreground",
        isError && "border-destructive/30 bg-destructive/5 text-destructive"
      )}>
        <div className="flex items-start gap-2">
          {isError && <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />}
          {!isUser && !isError && <BotIcon className="mt-0.5 size-4 shrink-0 text-primary" />}
          <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {content}
            {isTyping && (
              <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-current align-middle" />
            )}
          </p>
        </div>
        {message.contexts?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.contexts.map((context) => (
              <span key={context.id} className={cn(
                "rounded-[6px] border px-1.5 py-0.5 text-[10px]",
                isUser ? "border-primary-foreground/25 text-primary-foreground/85"
                       : "border-border bg-background/60 text-muted-foreground"
              )}>
                {context.label}
              </span>
            ))}
          </div>
        ) : null}
        <span className={cn(
          "mt-1 block text-right text-[10px]",
          isUser ? "text-primary-foreground/75" : "text-muted-foreground"
        )}>
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}

function EmptyPromptState({ onSelectPrompt }) {
  return (
    <div className="flex min-h-full items-center justify-center px-1 py-4">
      <div className="w-full max-w-[320px]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-primary">
            <Image src="/orb-ia.svg" className="dark:invert" alt="Orb" width={58} height={58} />
          </div>
          <h3 className="m-0 text-left text-xl font-semibold leading-tight text-foreground">
            O que posso olhar por você?
          </h3>
        </div>

        <div className="grid gap-1.5">
          {SUGGESTED_PROMPTS.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectPrompt(item.prompt)}
                className="group flex w-full items-center gap-3 rounded-[8px] px-2 py-2 text-left text-sm text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Cola esse hook fora do componente, antes do export function DashboardAiAssistant
function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = React.useState("")
  const [isDone, setIsDone] = React.useState(true)

  React.useEffect(() => {
    if (!text) return
    setDisplayed("")
    setIsDone(false)
    let index = 0
    const interval = setInterval(() => {
      index++
      setDisplayed(text.slice(0, index))
      if (index >= text.length) {
        clearInterval(interval)
        setIsDone(true)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return { displayed, isDone }
}

export function DashboardAiAssistant() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState([])
  const [pageContexts, setPageContexts] = React.useState([])
  const [inlineError, setInlineError] = React.useState("")
  const [lastFailedRequest, setLastFailedRequest] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const messagesEndRef = React.useRef(null)
  const textareaRef = React.useRef(null)

  const trimmedInput = input.trim()
  const promptPayload = React.useMemo(
    () => buildPromptPayload(trimmedInput, pageContexts),
    [pageContexts, trimmedInput]
  )
  const hasPromptExtras = pageContexts.length > 0
  const promptLength = hasPromptExtras ? promptPayload.length : input.length
  const canSend =
    !loading &&
    trimmedInput.length >= MIN_QUESTION_LENGTH &&
    promptPayload.length <= MAX_QUESTION_LENGTH

  React.useEffect(() => {
    if (!open) {
      return
    }

    window.setTimeout(() => textareaRef.current?.focus(), 80)
  }, [open])

  React.useEffect(() => {
    if (!open) {
      return
    }

    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [messages, loading, open])

  async function sendQuestion({ question, contexts = [], showUserMessage = true }) {
    const normalizedQuestion = question.trim()
    const payloadQuestion = buildPromptPayload(normalizedQuestion, contexts)

    if (normalizedQuestion.length < MIN_QUESTION_LENGTH) {
      setInlineError("Escreva uma pergunta com pelo menos 3 caracteres.")
      return
    }

    if (payloadQuestion.length > MAX_QUESTION_LENGTH) {
      setInlineError("A pergunta com contexto deve ter no maximo 500 caracteres.")
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      setInlineError("Faca login para consultar a IA.")
      return
    }

    setInlineError("")
    setLastFailedRequest(null)
    if (showUserMessage) {
      setMessages((current) => [
        ...current,
        createMessage("user", normalizedQuestion, {
          contexts,
        }),
      ])
    }
    setLoading(true)

    try {
      const payload = await askDashboardAi(payloadQuestion, session.accessToken)
      const answer = payload.resposta?.trim()

      if (!answer) {
        throw new Error("A IA retornou uma resposta vazia. Tente novamente.")
      }

      setMessages((current) => [...current, createMessage("assistant", answer)])
    } catch (error) {
      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setLastFailedRequest({
        question: normalizedQuestion,
        contexts,
      })
      setMessages((current) => [
        ...current,
        createMessage("error", getErrorMessage(error)),
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event?.preventDefault()

    if (!canSend) {
      if (trimmedInput.length > 0 && trimmedInput.length < MIN_QUESTION_LENGTH) {
        setInlineError("Escreva uma pergunta com pelo menos 3 caracteres.")
      } else if (promptPayload.length > MAX_QUESTION_LENGTH) {
        setInlineError("Remova contexto ou reduza a pergunta para ficar dentro de 500 caracteres.")
      }
      return
    }

    const question = trimmedInput
    const requestContexts = pageContexts
    setInput("")
    setPageContexts([])
    sendQuestion({
      question,
      contexts: requestContexts,
    })
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  function handleRetry() {
    if (!lastFailedRequest || loading) {
      return
    }

    sendQuestion({ ...lastFailedRequest, showUserMessage: false })
  }

  function addCurrentPageContext() {
    const context = getCurrentPageContext(pathname)

    setPageContexts((current) => {
      if (current.some((item) => item.id === context.id)) {
        setInlineError("O contexto desta pagina ja foi adicionado.")
        return current
      }

      setInlineError("")
      return [...current, context]
    })
  }

  function removePageContext(id) {
    setPageContexts((current) => current.filter((context) => context.id !== id))
  }

  function handleSuggestedPrompt(prompt) {
    setInput(prompt)
    setInlineError("")
    window.setTimeout(() => textareaRef.current?.focus(), 0)
  }

  return (
    <>
      {open ? (
        <section
          aria-label="Orb"
          className="fixed inset-x-3 bottom-20 z-40 flex h-[min(620px,calc(100svh-7rem))] flex-col overflow-hidden rounded-[8px] border bg-popover text-popover-foreground shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[420px]"
        >
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="m-0 truncate text-sm font-semibold">Orb - IA Preditiva</h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="p-0!"
              onClick={() => setOpen(false)}
              aria-label="Fechar Orbis IA"
            >
              <XIcon className="size-4" />
            </Button>
          </header>

          <div
            aria-live="polite"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 ? (
              <EmptyPromptState onSelectPrompt={handleSuggestedPrompt} />
            ) : (
              messages.map((message, index) => <ChatMessage key={message.id} message={message} animate={message.role === "assistant" && index === messages.length - 1} />)
            )}
            {loading ? (
              <div className="flex justify-start">
                <div className="flex max-w-[86%] items-center gap-2 rounded-[8px] border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  Processando...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t bg-muted/20 px-3 py-3">
            {inlineError ? (
              <p className="m-0 mb-2 text-xs text-destructive">{inlineError}</p>
            ) : null}
            {pageContexts.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {pageContexts.map((context) => (
                  <button
                    key={context.id}
                    type="button"
                    onClick={() => removePageContext(context.id)}
                    className="inline-flex max-w-full items-center gap-1 rounded-[8px] border bg-background px-2 py-1 text-xs text-muted-foreground"
                  >
                    <FileTextIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{context.label}</span>
                    <XIcon className="size-3 shrink-0" />
                  </button>
                ))}
              </div>
            ) : null}
            {lastFailedRequest && !loading ? (
              <div className="mb-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2! py-0!"
                  onClick={handleRetry}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="mb-4 p-0!"
                    disabled={loading}
                    aria-label="Adicionar contexto"
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-56">
                  <DropdownMenuItem onSelect={addCurrentPageContext}>
                    <FileTextIcon className="size-4" />
                    Contexto da pagina
                  </DropdownMenuItem>
                  {pageContexts.length > 0 ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          setPageContexts([])
                        }}
                      >
                        <XIcon className="size-4" />
                        Limpar contexto
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="min-w-0 flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value)
                    setInlineError("")
                  }}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_QUESTION_LENGTH}
                  rows={2}
                  placeholder="Pergunte sobre maquinas, sensores ou alertas..."
                  className="max-h-28 min-h-12 w-full resize-none rounded-[8px] border bg-background px-3 py-2 text-sm leading-relaxed outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                  aria-label="Pergunta para a IA"
                />
                <span
                  className={cn(
                    "block text-right text-[10px] text-muted-foreground",
                    promptLength > MAX_QUESTION_LENGTH && "text-destructive"
                  )}
                >
                  {promptLength}/{MAX_QUESTION_LENGTH}
                  {hasPromptExtras ? " com contexto" : ""}
                </span>
              </div>
              <Button
                type="submit"
                size="icon-lg"
                className="mb-4 p-0!"
                disabled={!canSend}
                aria-label="Enviar pergunta"
              >
                {loading ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-lg"
            className="fixed dark:bg-[#1e2939] bottom-5 right-5 z-40 size-12 rounded-full! p-0! hover:scale-[1.06] border-1 border-black/30 bg-white"
            onClick={() => setOpen((current) => !current)}
            aria-label="Agente Orb"
            aria-expanded={open}
          >
            <Image src="/orb-ia.svg" className="dark:invert" alt="Orb" width={34} height={34} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>Converse com o Orb!</TooltipContent>
      </Tooltip>
    </>
  )
}
