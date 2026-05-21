"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"
import {
  AlertTriangleIcon,
  FileTextIcon,
  Loader2Icon,
  LucideEye,
  Maximize2Icon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  Minimize2Icon,
  PanelLeftIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  SquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useOptionalDashboardPreferences } from "@/components/context/dashboard-preferences-context"
import { clearAuthSession, getAuthSession } from "@/lib/auth-session"
import { askDashboardAi, getHttpErrorStatus } from "@/lib/dashboard-api"
import { cn } from "@/lib/utils"

const MIN_QUESTION_LENGTH = 3
const MAX_QUESTION_LENGTH = 500
const CHAT_HISTORY_STORAGE_KEY = "orbis-orb-chat-history"
const SPEECH_LANGUAGE_STORAGE_KEY = "orbis-orb-speech-language"
const MAX_CHAT_HISTORY_ITEMS = 12
const ORB_FULLSCREEN_SCROLL_LOCK = "orb-fullscreen"
const SPEECH_LANGUAGE_OPTIONS = [
  { value: "pt-BR", label: "Português", shortLabel: "PT" },
  { value: "en-US", label: "English", shortLabel: "EN" },
  { value: "es-ES", label: "Español", shortLabel: "ES" },
]
const SPEECH_LANGUAGE_VALUES = new Set(SPEECH_LANGUAGE_OPTIONS.map((option) => option.value))
const ORB_COMPACT_GAP = 20
const ORB_COMPACT_BOTTOM = 80
const ORB_COMPACT_WIDTH = 420
const ORB_COMPACT_HEIGHT = 620
const ORB_MIN_WIDTH = 360
const ORB_MIN_HEIGHT = 420
const ORB_EXPANDED_MAX_WIDTH = 1120
const ORB_EXPANDED_MAX_HEIGHT = 760
const ORB_WINDOW_MARGIN = 16
const ORB_BUTTON_SIZE = 48
const ORB_TRANSITION_MS = 460
const ORB_BUTTON_RADIUS = 24
const ORB_PANEL_RADIUS = 8
export const DASHBOARD_AI_ASSISTANT_OPEN_EVENT = "orbis:open-dashboard-ai-assistant"

const ORB_BUTTON_POSITIONS = [
  "top-left",
  "top-right",
  "center-left",
  "center-right",
  "bottom-left",
  "bottom-right",
]

const CHAT_TITLE_STOPWORDS = new Set([
  "a",
  "agora",
  "ai",
  "algo",
  "as",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "eu",
  "ia",
  "me",
  "meu",
  "minha",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "que",
  "quais",
  "qual",
  "sobre",
  "um",
  "uma",
])

const PAGE_CONTEXTS = [
  {
    path: "/dashboard/maquinas",
    label: "Máquinas",
    description: "gestão e leitura operacional das máquinas cadastradas",
  },
  {
    path: "/dashboard/sensores",
    label: "Sensores",
    description: "monitoramento de sensores, status e últimas leituras",
  },
  {
    path: "/dashboard/alertas",
    label: "Alertas",
    description: "alertas, severidade, status e priorização de atendimento",
  },
  {
    path: "/dashboard/tecnicos",
    label: "Técnicos",
    description: "equipe técnica, disponibilidade e cadastro de usuários técnicos",
  },
  {
    path: "/dashboard/relatorios",
    label: "Relatórios",
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
    icon: LucideEye,
    label: "Conferir sensores",
    prompt: "Quais sensores parecem exigir uma verificação mais cuidadosa?",
  },
  {
    icon: FileTextIcon,
    label: "Planejar próximos passos",
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

function getBrowserSpeechLanguage() {
  if (typeof window === "undefined") {
    return "pt-BR"
  }

  try {
    const storedLanguage = window.localStorage.getItem(SPEECH_LANGUAGE_STORAGE_KEY)

    if (SPEECH_LANGUAGE_VALUES.has(storedLanguage)) {
      return storedLanguage
    }
  } catch {}

  const browserLanguage = String(window.navigator?.language || "").toLowerCase()

  if (browserLanguage.startsWith("en")) {
    return "en-US"
  }

  if (browserLanguage.startsWith("es")) {
    return "es-ES"
  }

  return "pt-BR"
}

function getSpeechLanguageOption(value) {
  return SPEECH_LANGUAGE_OPTIONS.find((option) => option.value === value) ?? SPEECH_LANGUAGE_OPTIONS[0]
}

function getChatTitleFromQuestion(question) {
  const words = String(question || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g) ?? []

  const keywords = []
  const seen = new Set()

  for (const word of words) {
    if (word.length < 3 || CHAT_TITLE_STOPWORDS.has(word) || seen.has(word)) {
      continue
    }

    seen.add(word)
    keywords.push(word.charAt(0).toUpperCase() + word.slice(1))

    if (keywords.length >= 3) {
      break
    }
  }

  if (keywords.length > 0) {
    return keywords.join(" ").slice(0, 28)
  }

  const fallback = String(question || "Nova conversa").trim()
  return fallback.length > 28 ? `${fallback.slice(0, 25).trim()}...` : fallback || "Nova conversa"
}

function createChat(messages = []) {
  const now = new Date().toISOString()
  const firstQuestion = messages.find((message) => message.role === "user")?.content ?? "Nova conversa"

  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: getChatTitleFromQuestion(firstQuestion),
    messages,
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeStoredMessages(messages) {
  if (!Array.isArray(messages)) {
    return []
  }

  return messages.map((message) =>
    // CORRIGIDO: era `message.animated !== false` (undefined !== false = true, marcava msgs nunca animadas como animated:true)
    // Agora só preserva animated:true quando foi explicitamente salvo como true
    message?.role === "assistant" && message.animated === true
      ? { ...message, animated: true }
      : message
  )
}

function loadChatHistory() {
  if (typeof window === "undefined") {
    return { chats: [], activeChatId: null }
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY) || "{}")
    const chats = Array.isArray(parsed.chats)
      ? parsed.chats.map((chat) => ({
          ...chat,
          messages: normalizeStoredMessages(chat.messages),
        }))
      : []
    const activeChatId = typeof parsed.activeChatId === "string" ? parsed.activeChatId : chats[0]?.id ?? null

    return { chats, activeChatId }
  } catch {
    return { chats: [], activeChatId: null }
  }
}

function saveChatHistory(chats, activeChatId) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(
      CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify({
        chats: chats.slice(0, MAX_CHAT_HISTORY_ITEMS),
        activeChatId,
      })
    )
  } catch {}
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
  if (error?.name === "AbortError") {
    return "Resposta cancelada."
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Não foi possível consultar a IA agora."
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
    lines.push(`Contexto de página: ${contexts.map((context) => context.text).join(" | ")}`)
  }

  lines.push(`Pergunta: ${question}`)

  return lines.join("\n")
}

function buildBackendHistory(messages) {
  if (!Array.isArray(messages)) {
    return []
  }

  return messages
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").trim(),
    }))
    .filter((message) => message.content.length > 0)
}

function renderInlineMarkdown(text, keyPrefix) {
  const value = String(text || "")
  const parts = value.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    const isDoubleBold = part.startsWith("**") && part.endsWith("**") && part.length > 4
    const isSingleBold = part.startsWith("*") && part.endsWith("*") && part.length > 2

    if (isDoubleBold || isSingleBold) {
      const offset = isDoubleBold ? 2 : 1
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(offset, -offset)}
        </strong>
      )
    }

    return <React.Fragment key={key}>{part}</React.Fragment>
  })
}

function FormattedMessageContent({ content, isTyping }) {
  const blocks = String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return (
      <p className="m-0 text-sm leading-relaxed">
        {isTyping ? <span className="inline-block h-[1em] w-0.5 animate-pulse bg-current align-middle" /> : null}
      </p>
    )
  }

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean)
        const isList = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line))

        if (isList) {
          return (
            <ul key={`block-${blockIndex}`} className="m-0 list-disc space-y-1 pl-4">
              {lines.map((line, lineIndex) => (
                <li key={`line-${blockIndex}-${lineIndex}`} className="pl-1">
                  {renderInlineMarkdown(line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, ""), `list-${blockIndex}-${lineIndex}`)}
                  {isTyping && blockIndex === blocks.length - 1 && lineIndex === lines.length - 1 ? (
                    <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-current align-middle" />
                  ) : null}
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={`block-${blockIndex}`} className="m-0 whitespace-pre-wrap break-words">
            {renderInlineMarkdown(block, `paragraph-${blockIndex}`)}
            {isTyping && blockIndex === blocks.length - 1 ? (
              <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-current align-middle" />
            ) : null}
          </p>
        )
      })}
    </div>
  )
}

function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = React.useState("")
  // CORRIGIDO: era `useState(true)` — com isDone=true no primeiro render, isTyping=false e o cursor não aparecia;
  // agora inicializa false quando há texto, evitando o frame inicial sem animação
  const [isDone, setIsDone] = React.useState(!text)

  // CORRIGIDO: era `useEffect` — trocado por `useLayoutEffect` para o intervalo começar
  // antes do paint, eliminando o race condition onde um re-render descartava o componente
  // antes do efeito disparar
  React.useLayoutEffect(() => {
    if (!text) {
      setIsDone(true)
      setDisplayed("")
      return
    }
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

function ChatMessage({ message, animate = false, onAnimationComplete }) {
  const isUser = message.role === "user"
  const isError = message.role === "error"

  const { displayed, isDone } = useTypewriter(animate ? message.content : "")
  const content = animate ? displayed : message.content
  const isTyping = animate && !isDone

  React.useEffect(() => {
    if (animate && isDone) {
      onAnimationComplete?.()
    }
  }, [animate, isDone, onAnimationComplete])

  return (
    <div className={cn("flex w-full items-start gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && !isError ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm">
          <Image src="/orb-ia.svg" className="dark:invert" alt="Orb" width={22} height={22} />
        </div>
      ) : null}
      <div className={cn(
        "max-w-[86%] rounded-[8px] border px-3 py-2 shadow-sm",
        isUser ? "border-primary/70 bg-primary text-primary-foreground"
               : "border-border bg-muted/40 text-foreground",
        isError && "border-destructive/30 bg-destructive/5 text-destructive"
      )}>
        <div className="flex items-start gap-2">
          {isError && <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />}
          <div className="min-w-0 flex-1 break-words">
            <FormattedMessageContent content={content} isTyping={isTyping} />
          </div>
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

function EmptyPromptState({ fullscreen = false, onSelectPrompt }) {
  return (
    <div className={cn(
      "flex min-h-full flex-1 items-center justify-center  px-1 py-4",
      fullscreen && "py-0"
    )}>
      <div className={cn("w-full", fullscreen ? "max-w-[400px]" : "max-w-[320px]")}>
        <div className={cn(
          "mb-5 flex items-center gap-3",
          fullscreen && "justify-center text-center"
        )}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-primary">
            <Image src="/orb-ia.svg" className="dark:invert" alt="Orb" width={58} height={58} />
          </div>
          <h3 className={cn(
            "m-0 text-xl font-semibold leading-tight text-foreground",
            fullscreen ? "text-center" : "text-left"
          )}>
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
                className={cn("group flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-2 py-2 text-left text-sm text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  fullscreen ? "ms-6 " : "ms-0"
                )}
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

function getAssistantViewport() {
  if (typeof window === "undefined") {
    return { width: 1280, height: 800 }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function clampAssistantRect(rect) {
  const viewport = getAssistantViewport()
  const maxWidth = Math.max(240, viewport.width - ORB_WINDOW_MARGIN * 2)
  const maxHeight = Math.max(320, viewport.height - ORB_WINDOW_MARGIN * 2)
  const minWidth = Math.min(ORB_MIN_WIDTH, maxWidth)
  const minHeight = Math.min(ORB_MIN_HEIGHT, maxHeight)
  const width = Math.min(Math.max(rect.width, minWidth), maxWidth)
  const height = Math.min(Math.max(rect.height, minHeight), maxHeight)
  const maxX = Math.max(ORB_WINDOW_MARGIN, viewport.width - width - ORB_WINDOW_MARGIN)
  const maxY = Math.max(ORB_WINDOW_MARGIN, viewport.height - height - ORB_WINDOW_MARGIN)
  const x = Math.min(Math.max(rect.x, ORB_WINDOW_MARGIN), maxX)
  const y = Math.min(Math.max(rect.y, ORB_WINDOW_MARGIN), maxY)

  return { x, y, width, height }
}

function getCompactAssistantRect(position = "bottom-right") {
  const viewport = getAssistantViewport()
  const width = Math.min(ORB_COMPACT_WIDTH, viewport.width - ORB_WINDOW_MARGIN * 2)
  const height = Math.min(ORB_COMPACT_HEIGHT, viewport.height - ORB_COMPACT_BOTTOM - ORB_WINDOW_MARGIN)
  const opensOnLeft = position.endsWith("left")

  return clampAssistantRect({
    x: opensOnLeft ? ORB_COMPACT_GAP : viewport.width - width - ORB_COMPACT_GAP,
    y: viewport.height - height - ORB_COMPACT_BOTTOM,
    width,
    height,
  })
}

function getExpandedAssistantRect() {
  const viewport = getAssistantViewport()
  const width = Math.min(ORB_EXPANDED_MAX_WIDTH, viewport.width - ORB_WINDOW_MARGIN * 2)
  const height = Math.min(ORB_EXPANDED_MAX_HEIGHT, viewport.height - ORB_WINDOW_MARGIN * 2)

  return clampAssistantRect({
    x: (viewport.width - width) / 2,
    y: (viewport.height - height) / 2,
    width,
    height,
  })
}

function getOrbButtonRect(position = "bottom-right") {
  const viewport = getAssistantViewport()
  const horizontal = position.endsWith("left") ? "left" : "right"
  const vertical = position.startsWith("top")
    ? "top"
    : position.startsWith("center")
      ? "center"
      : "bottom"

  return {
    x: horizontal === "left" ? ORB_COMPACT_GAP : viewport.width - ORB_BUTTON_SIZE - ORB_COMPACT_GAP,
    y:
      vertical === "top"
        ? ORB_COMPACT_GAP
        : vertical === "center"
          ? (viewport.height - ORB_BUTTON_SIZE) / 2
          : viewport.height - ORB_BUTTON_SIZE - ORB_COMPACT_GAP,
    width: ORB_BUTTON_SIZE,
    height: ORB_BUTTON_SIZE,
  }
}

function clampOrbButtonRect(rect) {
  const viewport = getAssistantViewport()

  return {
    x: Math.min(Math.max(rect.x, ORB_COMPACT_GAP), viewport.width - ORB_BUTTON_SIZE - ORB_COMPACT_GAP),
    y: Math.min(Math.max(rect.y, ORB_COMPACT_GAP), viewport.height - ORB_BUTTON_SIZE - ORB_COMPACT_GAP),
    width: ORB_BUTTON_SIZE,
    height: ORB_BUTTON_SIZE,
  }
}

function getClosestOrbButtonPosition(rect) {
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  return ORB_BUTTON_POSITIONS.reduce((closest, position) => {
    const candidate = getOrbButtonRect(position)
    const candidateCenterX = candidate.x + candidate.width / 2
    const candidateCenterY = candidate.y + candidate.height / 2
    const distance = Math.hypot(centerX - candidateCenterX, centerY - candidateCenterY)

    if (!closest || distance < closest.distance) {
      return { position, distance }
    }

    return closest
  }, null)?.position ?? "bottom-right"
}

export function DashboardAiAssistant() {
  const pathname = usePathname()
  const dashboardPreferences = useOptionalDashboardPreferences()
  const smoothScrollEnabled = dashboardPreferences?.preferences.smoothScrollEnabled ?? true
  const orbButtonVisible = dashboardPreferences?.preferences.orbButtonVisible ?? true
  const orbButtonPosition = dashboardPreferences?.preferences.orbButtonPosition ?? "bottom-right"
  const setOrbButtonPosition = dashboardPreferences?.setOrbButtonPosition
  const [open, setOpen] = React.useState(false)
  const [assistantPhase, setAssistantPhase] = React.useState("closed")
  const [fullscreen, setFullscreen] = React.useState(false)
  const [assistantRect, setAssistantRect] = React.useState(null)
  const [isMovingWindow, setIsMovingWindow] = React.useState(false)
  const [isResizingWindow, setIsResizingWindow] = React.useState(false)
  const [historySidebarOpen, setHistorySidebarOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState([])
  const [chatHistory, setChatHistory] = React.useState([])
  const [activeChatId, setActiveChatId] = React.useState(null)
  const [historyLoaded, setHistoryLoaded] = React.useState(false)
  const [pageContexts, setPageContexts] = React.useState([])
  const [inlineError, setInlineError] = React.useState("")
  const [lastFailedRequest, setLastFailedRequest] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [speechSupported, setSpeechSupported] = React.useState(false)
  const [speechListening, setSpeechListening] = React.useState(false)
  const [speechStatus, setSpeechStatus] = React.useState("")
  const [speechLanguage, setSpeechLanguage] = React.useState("pt-BR")
  const [orbDragRect, setOrbDragRect] = React.useState(null)
  const [isDraggingOrbButton, setIsDraggingOrbButton] = React.useState(false)
  const [activeOrbButtonPosition, setActiveOrbButtonPosition] = React.useState(orbButtonPosition)
  const messagesEndRef = React.useRef(null)
  const chatScrollRef = React.useRef(null)
  const chatContentRef = React.useRef(null)
  const chatLenisRef = React.useRef(null)
  const textareaRef = React.useRef(null)
  const abortControllerRef = React.useRef(null)
  const messagesRef = React.useRef([])
  const activeChatIdRef = React.useRef(null)
  const speechRecognitionRef = React.useRef(null)
  const speechBaseInputRef = React.useRef("")
  const speechFinalTranscriptRef = React.useRef("")
  const windowActionRef = React.useRef(null)
  const orbButtonActionRef = React.useRef(null)
  const activeOrbButtonPositionRef = React.useRef(activeOrbButtonPosition)
  const skipNextOrbClickRef = React.useRef(false)
  const animationTimersRef = React.useRef([])

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
  const speechLanguageOption = getSpeechLanguageOption(speechLanguage)
  const assistantReady = assistantPhase === "open"
  const assistantTransitionDuration =
    assistantPhase === "opening" || assistantPhase === "closing"
      ? ORB_TRANSITION_MS
      : ORB_TRANSITION_MS
  const assistantBorderRadius =
    assistantPhase === "opening-start" || assistantPhase === "closing"
      ? ORB_BUTTON_RADIUS
      : ORB_PANEL_RADIUS

  React.useEffect(() => {
    activeOrbButtonPositionRef.current = activeOrbButtonPosition
  }, [activeOrbButtonPosition])

  React.useEffect(() => {
    if (!isDraggingOrbButton) {
      setActiveOrbButtonPosition(orbButtonPosition)
    }
  }, [isDraggingOrbButton, orbButtonPosition])

  React.useEffect(() => {
    const stored = loadChatHistory()
    const activeChat =
      stored.chats.find((chat) => chat.id === stored.activeChatId) ??
      stored.chats[0] ??
      null

    setChatHistory(stored.chats)
    setActiveChatId(activeChat?.id ?? null)
    setMessages(activeChat?.messages ?? [])
    activeChatIdRef.current = activeChat?.id ?? null
    messagesRef.current = activeChat?.messages ?? []
    setHistoryLoaded(true)
  }, [])

  React.useEffect(() => {
    setSpeechLanguage(getBrowserSpeechLanguage())
  }, [])

  React.useEffect(() => {
    if (!historyLoaded) {
      return
    }

    saveChatHistory(chatHistory, activeChatId)
  }, [activeChatId, chatHistory, historyLoaded])

  React.useEffect(() => {
    if (!open) {
      stopSpeechRecognition()
      setAssistantPhase("closed")
      setFullscreen(false)
      setHistorySidebarOpen(false)
      setAssistantRect(null)
      return
    }

  }, [open])

  React.useEffect(() => {
    function handleExternalOpen(event) {
      openAssistant({
        fullscreen: event instanceof CustomEvent ? event.detail?.fullscreen === true : false,
      })
    }

    window.addEventListener(DASHBOARD_AI_ASSISTANT_OPEN_EVENT, handleExternalOpen)

    return () => {
      window.removeEventListener(DASHBOARD_AI_ASSISTANT_OPEN_EVENT, handleExternalOpen)
    }
  })

  React.useEffect(() => {
    if (!assistantReady) {
      return
    }

    if (fullscreen) {
      setHistorySidebarOpen(false)
      setAssistantRect(getExpandedAssistantRect())
    } else if (open) {
      setAssistantRect(getCompactAssistantRect(activeOrbButtonPositionRef.current))
    }
  }, [assistantReady, fullscreen, open])

  React.useEffect(() => {
    if (!open) {
      return
    }

    function handleResize() {
      setAssistantRect((current) => {
        if (!current) {
          return fullscreen ? getExpandedAssistantRect() : getCompactAssistantRect(activeOrbButtonPositionRef.current)
        }

        if (!fullscreen) {
          return getCompactAssistantRect(activeOrbButtonPositionRef.current)
        }

        return clampAssistantRect(current)
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [fullscreen, open])

  React.useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      animationTimersRef.current = []
    }
  }, [])

  React.useEffect(() => {
    if (!open || !smoothScrollEnabled) {
      chatLenisRef.current?.destroy()
      chatLenisRef.current = null
      return
    }

    const wrapper = chatScrollRef.current
    const content = chatContentRef.current

    if (!wrapper || !content) {
      return
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const connection = navigator.connection

    if (prefersReducedMotion || connection?.saveData) {
      return
    }

    const lenis = new Lenis({
      wrapper,
      content,
      duration: 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    let rafId = 0

    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    chatLenisRef.current = lenis
    rafId = requestAnimationFrame(raf)

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      lenis.destroy()

      if (chatLenisRef.current === lenis) {
        chatLenisRef.current = null
      }
    }
  }, [open, smoothScrollEnabled])

  React.useEffect(() => {
    if (!open) {
      return
    }

    const scrollElement = chatScrollRef.current

    if (scrollElement) {
      const target = scrollElement.scrollHeight

      if (chatLenisRef.current && smoothScrollEnabled) {
        chatLenisRef.current.resize()
        chatLenisRef.current.scrollTo(target, { duration: 0.45 })
      } else {
        scrollElement.scrollTo({
          top: target,
          behavior: smoothScrollEnabled ? "smooth" : "auto",
        })
      }
      return
    }

    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: smoothScrollEnabled ? "smooth" : "auto",
    })
  }, [messages, loading, open, smoothScrollEnabled])

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      removeOrbButtonMoveListeners()
    }
  }, [])

  React.useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)

    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = speechLanguage
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setSpeechListening(true)
      setSpeechStatus("Ouvindo...")
    }

    recognition.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = speechFinalTranscriptRef.current

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript ?? ""

        if (event.results[index].isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim()
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim()
        }
      }

      speechFinalTranscriptRef.current = finalTranscript
      const spokenText = `${finalTranscript} ${interimTranscript}`.trim()
      const baseInput = speechBaseInputRef.current.trim()
      const nextInput = baseInput && spokenText ? `${baseInput} ${spokenText}` : spokenText || baseInput

      setInput(nextInput.slice(0, MAX_QUESTION_LENGTH))
      setInlineError("")
      setSpeechStatus(interimTranscript ? "Transcrevendo..." : "Ouvindo...")
    }

    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Permita o uso do microfone para transcrever."
          : event.error === "no-speech"
            ? "Nenhuma fala detectada."
            : "Não foi possível transcrever o áudio."

      setSpeechStatus(message)
      setSpeechListening(false)
    }

    recognition.onend = () => {
      setSpeechListening(false)
      setSpeechStatus((current) => {
        if (current && current !== "Ouvindo..." && current !== "Transcrevendo...") {
          return current
        }

        return speechFinalTranscriptRef.current ? "Transcrição concluída." : ""
      })
    }

    speechRecognitionRef.current = recognition
    setSpeechSupported(true)

    return () => {
      recognition.abort()
      speechRecognitionRef.current = null
    }
  }, [speechLanguage])

  React.useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    const minHeight = 48
    const maxHeight = fullscreen ? 160 : 112

    textarea.style.height = "auto"
    const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden"
    textarea.scrollTop = textarea.scrollHeight
  }, [fullscreen, input, open])

  function syncActiveChat(nextMessages) {
    messagesRef.current = nextMessages
    setMessages(nextMessages)

    if (nextMessages.length === 0) {
      return null
    }

    let resolvedChatId = activeChatIdRef.current

    if (!resolvedChatId) {
      const created = createChat(nextMessages)
      resolvedChatId = created.id
      activeChatIdRef.current = created.id
      setActiveChatId(created.id)
      setChatHistory((current) => [created, ...current].slice(0, MAX_CHAT_HISTORY_ITEMS))
      return created.id
    }

    setChatHistory((current) => {
      const now = new Date().toISOString()
      const existingIndex = current.findIndex((chat) => chat.id === resolvedChatId)
      if (existingIndex >= 0) {
        const existing = current[existingIndex]
        const updated = {
          ...existing,
          title: createChat(nextMessages).title,
          messages: nextMessages,
          updatedAt: now,
        }
        return [
          updated,
          ...current.slice(0, existingIndex),
          ...current.slice(existingIndex + 1),
        ].slice(0, MAX_CHAT_HISTORY_ITEMS)
      }

      const created = createChat(nextMessages)
      return [created, ...current].slice(0, MAX_CHAT_HISTORY_ITEMS)
    })

    return resolvedChatId
  }

  function appendMessages(...nextItems) {
    const nextMessages = [...messagesRef.current, ...nextItems]
    syncActiveChat(nextMessages)
  }

  function startNewChat() {
    if (loading) {
      abortControllerRef.current?.abort()
    }

    stopSpeechRecognition()
    abortControllerRef.current = null
    setLoading(false)
    setInput("")
    setPageContexts([])
    setInlineError("")
    setSpeechStatus("")
    setLastFailedRequest(null)
    setActiveChatId(null)
    activeChatIdRef.current = null
    messagesRef.current = []
    setMessages([])
  }

  function openChat(chatId) {
    if (loading) {
      abortControllerRef.current?.abort()
    }

    stopSpeechRecognition()
    const chat = chatHistory.find((item) => item.id === chatId)
    if (!chat) {
      return
    }

    abortControllerRef.current = null
    setLoading(false)
    setInlineError("")
    setSpeechStatus("")
    setLastFailedRequest(null)
    setActiveChatId(chat.id)
    activeChatIdRef.current = chat.id
    messagesRef.current = chat.messages
    setMessages(chat.messages)
  }

  function deleteChat(chatId) {
    setChatHistory((current) => current.filter((chat) => chat.id !== chatId))

    if (activeChatId === chatId) {
      setActiveChatId(null)
      activeChatIdRef.current = null
      messagesRef.current = []
      setMessages([])
    }
  }

  function cancelResponse() {
    abortControllerRef.current?.abort()
  }

  function stopSpeechRecognition() {
    try {
      speechRecognitionRef.current?.stop()
    } catch {}

    setSpeechListening(false)
  }

  function startSpeechRecognition() {
    if (!speechSupported || !speechRecognitionRef.current) {
      setSpeechStatus("Transcrição por voz indisponível neste navegador.")
      return
    }

    if (speechListening) {
      stopSpeechRecognition()
      return
    }

    try {
      speechBaseInputRef.current = input.trim()
      speechFinalTranscriptRef.current = ""
      speechRecognitionRef.current.lang = speechLanguage
      setInlineError("")
      setSpeechStatus("Ouvindo...")
      speechRecognitionRef.current.start()
      textareaRef.current?.focus()
    } catch {
      setSpeechStatus("Não foi possível iniciar o microfone.")
      setSpeechListening(false)
    }
  }

  function handleSpeechLanguageChange(value) {
    if (!SPEECH_LANGUAGE_VALUES.has(value)) {
      return
    }

    stopSpeechRecognition()
    setSpeechLanguage(value)
    setSpeechStatus("")

    try {
      window.localStorage.setItem(SPEECH_LANGUAGE_STORAGE_KEY, value)
    } catch {}
  }

  function markMessageAnimated(messageId) {
    const nextMessages = messagesRef.current.map((message) =>
      message.id === messageId ? { ...message, animated: true } : message
    )

    syncActiveChat(nextMessages)
  }

  async function sendQuestion({ question, contexts = [], showUserMessage = true }) {
    const normalizedQuestion = question.trim()
    const payloadQuestion = buildPromptPayload(normalizedQuestion, contexts)

    if (normalizedQuestion.length < MIN_QUESTION_LENGTH) {
      setInlineError("Escreva uma pergunta com pelo menos 3 caracteres.")
      return
    }

    if (payloadQuestion.length > MAX_QUESTION_LENGTH) {
      setInlineError("A pergunta com contexto deve ter no máximo 500 caracteres.")
      return
    }

    const session = getAuthSession()

    if (!session?.accessToken) {
      setInlineError("Faça login para consultar a IA.")
      return
    }

    const abortController = new AbortController()

    setInlineError("")
    setLastFailedRequest(null)
    const userMessage = createMessage("user", normalizedQuestion, {
      contexts,
    })
    if (showUserMessage) {
      appendMessages(userMessage)
    }
    abortControllerRef.current = abortController
    setLoading(true)

    try {
      const historico = buildBackendHistory(messagesRef.current)
      const payload = await askDashboardAi(payloadQuestion, session.accessToken, {
        signal: abortController.signal,
        historico,
      })
      const answer = payload.resposta?.trim()

      if (!answer) {
        throw new Error("A IA retornou uma resposta vazia. Tente novamente.")
      }

      const baseMessages = showUserMessage ? [...messagesRef.current] : messagesRef.current
      syncActiveChat([...baseMessages, createMessage("assistant", answer)])
    } catch (error) {
      if (error?.name === "AbortError") {
        const baseMessages = showUserMessage ? [...messagesRef.current] : messagesRef.current
        syncActiveChat([...baseMessages, createMessage("error", "Resposta cancelada.")])
        return
      }

      if (getHttpErrorStatus(error) === 401) {
        clearAuthSession()
      }

      setLastFailedRequest({
        question: normalizedQuestion,
        contexts,
      })
      const baseMessages = showUserMessage ? [...messagesRef.current] : messagesRef.current
      syncActiveChat([...baseMessages, createMessage("error", getErrorMessage(error))])
    } finally {
      abortControllerRef.current = null
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
    stopSpeechRecognition()
    setSpeechStatus("")
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
        setInlineError("O contexto desta página já foi adicionado.")
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

  function handleAssistantWheelCapture(event) {
    const scrollElement = chatScrollRef.current

    if (chatLenisRef.current || !scrollElement || event.deltaY === 0) {
      return
    }

    if (event.target instanceof HTMLElement && event.target.closest("textarea")) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    scrollElement.scrollTop += event.deltaY
  }

  function clearAssistantAnimationTimers() {
    animationTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    animationTimersRef.current = []
  }

  function scheduleAssistantAnimation(callback, delay) {
    const timerId = window.setTimeout(() => {
      animationTimersRef.current = animationTimersRef.current.filter((id) => id !== timerId)
      callback()
    }, delay)

    animationTimersRef.current.push(timerId)
  }

  function openAssistant(options = {}) {
    const shouldOpenFullscreen = options.fullscreen === true

    clearAssistantAnimationTimers()

    if (open && assistantReady) {
      setFullscreen(shouldOpenFullscreen)
      setHistorySidebarOpen(false)
      setAssistantRect(shouldOpenFullscreen ? getExpandedAssistantRect() : getCompactAssistantRect(activeOrbButtonPosition))
      window.setTimeout(() => textareaRef.current?.focus(), 0)
      return
    }

    setFullscreen(shouldOpenFullscreen)
    setHistorySidebarOpen(false)
    setAssistantPhase("opening-start")
    setAssistantRect(getOrbButtonRect(activeOrbButtonPosition))
    setOpen(true)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAssistantPhase("opening")
        setAssistantRect(shouldOpenFullscreen ? getExpandedAssistantRect() : getCompactAssistantRect(activeOrbButtonPosition))

        scheduleAssistantAnimation(() => {
          setAssistantPhase("open")
          window.setTimeout(() => textareaRef.current?.focus(), 0)
        }, ORB_TRANSITION_MS)
      })
    })
  }

  function closeAssistant() {
    clearAssistantAnimationTimers()

    windowActionRef.current = null
    setIsMovingWindow(false)
    setIsResizingWindow(false)
    setFullscreen(false)
    setHistorySidebarOpen(false)
    setAssistantPhase("closing")
    setAssistantRect(getOrbButtonRect(activeOrbButtonPosition))

    scheduleAssistantAnimation(() => {
      setOpen(false)
      setAssistantPhase("closed")
      setAssistantRect(null)
    }, ORB_TRANSITION_MS)
  }

  function beginWindowMove(event) {
    if (!fullscreen || event.button !== 0) {
      return
    }

    if (event.target instanceof HTMLElement && event.target.closest("button,a,input,textarea,[role='menuitem']")) {
      return
    }

    event.preventDefault()
    windowActionRef.current = {
      type: "move",
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      startRect: assistantRect ?? getExpandedAssistantRect(),
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsMovingWindow(true)
  }

  function beginWindowResize(event) {
    if (!fullscreen || event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    windowActionRef.current = {
      type: "resize",
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      startRect: assistantRect ?? getExpandedAssistantRect(),
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setIsResizingWindow(true)
  }

  function handleWindowPointerMove(event) {
    const action = windowActionRef.current

    if (!action || action.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - action.startX
    const deltaY = event.clientY - action.startY

    if (action.type === "move") {
      setAssistantRect(clampAssistantRect({
        ...action.startRect,
        x: action.startRect.x + deltaX,
        y: action.startRect.y + deltaY,
      }))
      return
    }

    setAssistantRect(clampAssistantRect({
      ...action.startRect,
      width: action.startRect.width + deltaX,
      height: action.startRect.height + deltaY,
    }))
  }

  function endWindowAction(event) {
    const action = windowActionRef.current

    if (!action || action.pointerId !== event.pointerId) {
      return
    }

    try {
      action.captureTarget?.releasePointerCapture?.(event.pointerId)
    } catch {
      // Pointer capture may already be gone if the browser cancels the gesture.
    }
    windowActionRef.current = null
    setIsMovingWindow(false)
    setIsResizingWindow(false)
  }

  function beginOrbButtonMove(event) {
    if (event.button !== 0) {
      return
    }

    const startRect = getOrbButtonRect(activeOrbButtonPosition)

    orbButtonActionRef.current = {
      pointerId: event.pointerId,
      captureTarget: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      startRect,
      currentRect: startRect,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    window.addEventListener("pointermove", handleOrbButtonPointerMove)
    window.addEventListener("pointerup", endOrbButtonMove)
    window.addEventListener("pointercancel", endOrbButtonMove)
  }

  function removeOrbButtonMoveListeners() {
    window.removeEventListener("pointermove", handleOrbButtonPointerMove)
    window.removeEventListener("pointerup", endOrbButtonMove)
    window.removeEventListener("pointercancel", endOrbButtonMove)
  }

  function handleOrbButtonPointerMove(event) {
    const action = orbButtonActionRef.current

    if (!action || action.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - action.startX
    const deltaY = event.clientY - action.startY

    if (!action.moved && Math.hypot(deltaX, deltaY) < 5) {
      return
    }

    event.preventDefault()
    action.moved = true
    skipNextOrbClickRef.current = true
    setIsDraggingOrbButton(true)
    action.currentRect = clampOrbButtonRect({
      ...action.startRect,
      x: action.startRect.x + deltaX,
      y: action.startRect.y + deltaY,
    })
    setOrbDragRect(action.currentRect)
  }

  function endOrbButtonMove(event) {
    const action = orbButtonActionRef.current

    if (!action || action.pointerId !== event.pointerId) {
      return
    }

    try {
      action.captureTarget?.releasePointerCapture?.(event.pointerId)
    } catch {}

    if (action.moved) {
      const nextPosition = getClosestOrbButtonPosition(action.currentRect)

      setActiveOrbButtonPosition(nextPosition)
      setOrbButtonPosition?.(nextPosition)
      setOrbDragRect(null)
      window.setTimeout(() => {
        skipNextOrbClickRef.current = false
      }, 0)
    }

    orbButtonActionRef.current = null
    setIsDraggingOrbButton(false)
    removeOrbButtonMoveListeners()
  }

  function handleOrbButtonClick(event) {
    if (skipNextOrbClickRef.current) {
      event.preventDefault()
      event.stopPropagation()
      skipNextOrbClickRef.current = false
      return
    }

    openAssistant()
  }

  function toggleFullscreen() {
    setFullscreen((current) => !current)
  }

  function renderHistoryButton(chat, variant = "dropdown") {
    const isActive = activeChatId === chat.id
    const commonContent = (
      <>
        <MessageSquareIcon className="size-4 shrink-0 " />
        <span className="min-w-0 flex-1 truncate">{chat.title}</span>
        <button
          type="button"
          className="cursor-pointer rounded p-1 text-muted-foreground transition hover:text-destructive"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            deleteChat(chat.id)
          }}
          aria-label={`Excluir conversa ${chat.title}`}
        >
          <Trash2Icon className="size-3.5 cursor-pointer!" />
        </button>
      </>
    )

    if (variant === "sidebar") {
      return (
        <div
          key={chat.id}
          className={cn(
            "flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left text-sm transition",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <button
            type="button"
            onClick={() => openChat(chat.id)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
          >
            <MessageSquareIcon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{chat.title}</span>
          </button>
          <button
            type="button"
            className="cursor-pointer rounded p-1 text-muted-foreground transition hover:text-destructive"
            onClick={() => deleteChat(chat.id)}
            aria-label={`Excluir conversa ${chat.title}`}
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      )
    }

    return (
      <DropdownMenuItem
        key={chat.id}
        onSelect={() => openChat(chat.id)}
        className={cn("cursor-pointer gap-2", isActive && "bg-muted")}
      >
        {commonContent}
      </DropdownMenuItem>
    )
  }

  const orbButtonRect = orbDragRect ?? getOrbButtonRect(activeOrbButtonPosition)
  const orbTooltipSide = activeOrbButtonPosition.endsWith("left") ? "right" : "left"

  return (
    <>
      {open ? (
        <section
          aria-label="Orb"
          onWheelCapture={handleAssistantWheelCapture}
          onPointerMove={handleWindowPointerMove}
          onPointerUp={endWindowAction}
          onPointerCancel={endWindowAction}
          style={
            assistantRect
              ? {
                  left: `${assistantRect.x}px`,
                  top: `${assistantRect.y}px`,
                  width: `${assistantRect.width}px`,
                  height: `${assistantRect.height}px`,
                  borderRadius: `${assistantBorderRadius}px`,
                  transitionDuration: `${assistantTransitionDuration}ms`,
                }
              : undefined
          }
          className={cn(
            "fixed z-40 flex origin-bottom-right transform-gpu flex-col overflow-hidden overscroll-contain border bg-popover text-popover-foreground opacity-100 shadow-2xl will-change-[left,top,width,height,border-radius]",
            (isMovingWindow || isResizingWindow)
              ? "transition-none"
              : "transition-[left,top,width,height,border-radius,box-shadow] ease-[cubic-bezier(0.22,1,0.36,1)]",
          )}
        >
          <header
            className={cn(
              "flex items-center gap-3 border-b px-4 py-3 transition-opacity duration-150",
              assistantReady ? "opacity-100" : "pointer-events-none opacity-0",
              fullscreen && "cursor-move select-none",
              fullscreen && "touch-none",
              isMovingWindow && "cursor-grabbing"
            )}
            onPointerDown={beginWindowMove}
          >
            {fullscreen ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer p-0!"
                onClick={() => setHistorySidebarOpen((current) => !current)}
                aria-label={historySidebarOpen ? "Ocultar histórico" : "Mostrar histórico"}
                aria-expanded={historySidebarOpen}
              >
                <PanelLeftIcon className="size-4" />
              </Button>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="m-0 truncate text-sm font-semibold">Orb - IA Preditiva</h2>
            </div>
            {!fullscreen ? (
            <DropdownMenu>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem className="cursor-pointer" onSelect={startNewChat}>
                  <PlusIcon className="size-4" />
                  Nova conversa
                </DropdownMenuItem>
                {chatHistory.length > 0 ? (
                  <>
                    <DropdownMenuSeparator />
                    {chatHistory.map((chat) => renderHistoryButton(chat))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer p-0!"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Sair da tela cheia" : "Expandir IA"}
            >
              {fullscreen ? <Minimize2Icon className="size-4 " /> : <Maximize2Icon className="size-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer p-0!"
              onClick={closeAssistant}
              aria-label="Fechar Orbis IA"
            >
              <XIcon className="size-4" />
            </Button>
          </header>

          <div className={cn(
            "flex min-h-0 flex-1 transition-opacity duration-150",
            assistantReady ? "opacity-100" : "pointer-events-none opacity-0"
          )}>
            {fullscreen ? (
              <aside
                className={cn(
                  "min-h-0 shrink-0 overflow-hidden border-r bg-muted/20 transition-[width,opacity] duration-300 ease-out",
                  historySidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0"
                )}
                aria-hidden={!historySidebarOpen}
              >
                <div className="flex h-full w-72 flex-col gap-3 p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer justify-start"
                    onClick={startNewChat}
                  >
                    <PlusIcon className="size-4" />
                    Nova conversa
                  </Button>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {chatHistory.length > 0 ? (
                      <div className="grid gap-1">
                        {chatHistory.map((chat) => renderHistoryButton(chat, "sidebar"))}
                      </div>
                    ) : (
                      <p className="m-0 px-2 py-3 text-sm text-muted-foreground">Nenhuma conversa salva.</p>
                    )}
                  </div>
                </div>
              </aside>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col">
              <div
                ref={chatScrollRef}
                aria-live="polite"
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4",
                  fullscreen && "md:px-8 lg:px-10"
                )}
              >
                <div
                  ref={chatContentRef}
                  className={cn(
                    "mx-auto flex min-h-full w-full flex-col gap-3",
                    fullscreen ? "max-w-3xl" : "max-w-none"
                  )}
                >
                  {messages.length === 0 ? (
                    <EmptyPromptState fullscreen={fullscreen} onSelectPrompt={handleSuggestedPrompt} />
                  ) : (
                    messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        animate={message.role === "assistant" && index === messages.length - 1 && !message.animated}
                        onAnimationComplete={() => markMessageAnimated(message.id)}
                      />
                    ))
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
              </div>

          <form onSubmit={handleSubmit} className={cn(
            "border-t bg-muted/20 px-3 py-3",
            fullscreen && "px-4 md:px-8 lg:px-10"
          )}>
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
                    className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded-[8px] border bg-background px-2 py-1 text-xs text-muted-foreground"
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
                  className="h-7 cursor-pointer px-2! py-0!"
                  onClick={handleRetry}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}
            <div className={cn("flex items-start gap-2", fullscreen && "mx-auto max-w-3xl")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="size-12 shrink-0 cursor-pointer p-0! disabled:cursor-not-allowed"
                    disabled={loading}
                    aria-label="Adicionar contexto"
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-45">
                  <DropdownMenuItem className="cursor-pointer" onSelect={addCurrentPageContext}>
                    <FileTextIcon className="size-4" />
                    Contexto da página
                  </DropdownMenuItem>
                  {pageContexts.length > 0 ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer"
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={speechListening ? "default" : "outline"}
                    size="icon-lg"
                    className={cn(
                      "size-12 shrink-0 cursor-pointer p-0! disabled:cursor-not-allowed",
                      speechListening && "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                    )}
                    disabled={loading || !speechSupported}
                    onClick={startSpeechRecognition}
                    aria-label={speechListening ? "Parar transcrição por voz" : "Transcrever pergunta por voz"}
                    aria-pressed={speechListening}
                  >
                    {speechListening ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  {speechSupported ? (speechListening ? "Parar transcrição" : "Falar pergunta") : "Voz indisponível"}
                </TooltipContent>
              </Tooltip>
              <div className="min-w-0  flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value)
                    setInlineError("")
                    setSpeechStatus("")
                  }}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_QUESTION_LENGTH}
                  rows={1}
                  placeholder="Pergunte sobre máquinas, sensores ou alertas..."
                  className="block h-12 min-h-12 w-full resize-none overflow-y-hidden rounded-[8px] border bg-background px-3 py-1 text-sm leading-5 outline-none transition-[height,border-color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                  aria-label="Pergunta para a IA"
                />
                <div className="mt-1 flex min-h-3 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 shrink-0 cursor-pointer rounded-[6px]! px-1.5! py-0! text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                          disabled={loading || speechListening}
                          aria-label={`Idioma da transcrição: ${speechLanguageOption.label}`}
                        >
                          {speechLanguageOption.shortLabel}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="top" className="w-40">
                        <DropdownMenuRadioGroup value={speechLanguage} onValueChange={handleSpeechLanguageChange}>
                          {SPEECH_LANGUAGE_OPTIONS.map((option) => (
                            <DropdownMenuRadioItem key={option.value} value={option.value} className="cursor-pointer">
                              <span className="w-6 text-xs font-semibold">{option.shortLabel}</span>
                              <span>{option.label}</span>
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span
                      className={cn(
                        "min-w-0 truncate text-[10px] text-muted-foreground",
                        speechListening && "text-[#7c3aed]",
                        speechStatus.includes("Não") || speechStatus.includes("Permita") || speechStatus.includes("Nenhuma")
                          ? "text-destructive"
                          : ""
                      )}
                    >
                      {speechStatus}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] text-muted-foreground",
                      promptLength > MAX_QUESTION_LENGTH && "text-destructive"
                    )}
                  >
                    {promptLength}/{MAX_QUESTION_LENGTH}
                    {hasPromptExtras ? " com contexto" : ""}
                  </span>
                </div>
              </div>
              <Button
                type={loading ? "button" : "submit"}
                size="icon-lg"
                className="size-12 shrink-0 cursor-pointer p-0! disabled:cursor-not-allowed"
                disabled={loading ? false : !canSend}
                onClick={loading ? cancelResponse : undefined}
                aria-label={loading ? "Cancelar resposta" : "Enviar pergunta"}
              >
                {loading ? <SquareIcon className="size-4 fill-current" /> : <SendIcon className="size-4" />}
              </Button>
            </div>
          </form>
            </div>
          </div>
          {fullscreen ? (
            <div
              className="absolute bottom-0 right-0 z-10 size-5 cursor-nwse-resize touch-none"
              onPointerDown={beginWindowResize}
              aria-hidden="true"
            >
              <span className="absolute bottom-1 right-1 block size-3 rounded-br-[4px] border-b-2 border-r-2 border-muted-foreground/50" />
            </div>
          ) : null}
        </section>
      ) : null}

      {!open && orbButtonVisible ? (
      <Tooltip className="">
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon-lg"
            style={{
              left: `${orbButtonRect.x}px`,
              top: `${orbButtonRect.y}px`,
            }}
            className={cn(
              "fixed z-40 size-12 cursor-grab touch-none overflow-hidden rounded-full! border-1 border-black/30 bg-white p-0! transition-[left,top,background-color,border-color,box-shadow] duration-300 ease-out hover:bg-muted active:cursor-grabbing dark:bg-[#1e2939] dark:hover:bg-[#263449]",
              isDraggingOrbButton && "cursor-grabbing transition-none"
            )}
            onPointerDown={beginOrbButtonMove}
            onClick={handleOrbButtonClick}
            aria-label="Agente Orb"
            aria-expanded={open}
          >
            <Image
              src="/orb-ia.svg"
              className="pointer-events-none block size-[34px] shrink-0 select-none dark:invert"
              alt="Orb"
              width={34}
              height={34}
              draggable={false}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side={orbTooltipSide}
          sideOffset={8}
          className="border bg-popover text-popover-foreground shadow-md [&_[data-slot=tooltip-arrow]]:bg-popover [&_[data-slot=tooltip-arrow]]:fill-popover"
        >
          Converse com o Orb!
        </TooltipContent>
      </Tooltip>
      ) : null}
    </>
  )
}
