"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  LockKeyholeIcon,
  MailIcon,
} from "lucide-react"

import { useLandingLanguage } from "@/components/landing/language-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CODE_LENGTH, OtpCodeInput } from "@/components/ui/otp-code-input"
import { isValidBackendPassword, isValidEmail } from "@/lib/form-formatters"
import { cn } from "@/lib/utils"
import {
  redefinePassword,
  requestPasswordReset,
  validatePasswordResetCode,
} from "@/lib/password-reset-api"

const INITIAL_FORM = {
  email: "",
  emailDestino: "",
  code: "",
  novaSenha: "",
  confirmarSenha: "",
}

const STEP_ORDER = ["email", "code", "password"]

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

function getStepIndex(step) {
  const index = STEP_ORDER.indexOf(step)
  return index === -1 ? STEP_ORDER.length : index + 1
}

export default function EsqueciSenhaPage() {
  const { copy } = useLandingLanguage()
  const resetCopy = copy.passwordReset
  const [step, setStep] = React.useState("email")
  const [form, setForm] = React.useState(INITIAL_FORM)
  const [pending, setPending] = React.useState(false)
  const [feedback, setFeedback] = React.useState(null)
  const autoSubmittedCodeRef = React.useRef("")

  const stepIndex = getStepIndex(step)
  const completed = step === "done"

  function updateField(name, value) {
    if (name === "code" && value.length < CODE_LENGTH) {
      autoSubmittedCodeRef.current = ""
    }

    setForm((current) => ({ ...current, [name]: value }))
    setFeedback(null)
  }

  function showError(message) {
    setFeedback({ type: "error", message })
  }

  function showSuccess(message) {
    setFeedback({ type: "success", message })
  }

  function resetFlow() {
    setForm(INITIAL_FORM)
    setStep("email")
    setFeedback(null)
    autoSubmittedCodeRef.current = ""
  }

  async function handleRequestCode(event) {
    event.preventDefault()

    const email = form.email.trim()
    const emailDestino = form.emailDestino.trim()

    if (!isValidEmail(email)) {
      showError(resetCopy.validation.email)
      return
    }

    if (!isValidEmail(emailDestino)) {
      showError(resetCopy.validation.emailDestino)
      return
    }

    setPending(true)

    try {
      const payload = await requestPasswordReset({ email, emailDestino })
      setStep("code")
      autoSubmittedCodeRef.current = ""
      showSuccess(payload?.message || payload?.mensagem || resetCopy.messages.codeSent)
    } catch (error) {
      showError(getErrorMessage(error, resetCopy.messages.requestError))
    } finally {
      setPending(false)
    }
  }

  async function validateCode(codeValue) {
    const code = codeValue.trim()

    if (code.length !== CODE_LENGTH) {
      showError(resetCopy.validation.code)
      return
    }

    setPending(true)

    try {
      const payload = await validatePasswordResetCode({
        email: form.email.trim(),
        code,
      })
      setStep("password")
      autoSubmittedCodeRef.current = ""
      showSuccess(payload?.message || payload?.mensagem || resetCopy.messages.codeValid)
    } catch (error) {
      showError(getErrorMessage(error, resetCopy.messages.codeError))
    } finally {
      setPending(false)
    }
  }

  async function handleValidateCode(event) {
    event.preventDefault()
    await validateCode(form.code)
  }

  async function handleRedefinePassword(event) {
    event.preventDefault()

    if (!isValidBackendPassword(form.novaSenha)) {
      showError(resetCopy.validation.password)
      return
    }

    if (form.novaSenha !== form.confirmarSenha) {
      showError(resetCopy.validation.passwordMatch)
      return
    }

    setPending(true)

    try {
      const payload = await redefinePassword({
        email: form.email.trim(),
        code: form.code.trim(),
        novaSenha: form.novaSenha,
      })
      setStep("done")
      setForm((current) => ({
        ...current,
        code: "",
        novaSenha: "",
        confirmarSenha: "",
      }))
      showSuccess(payload?.message || payload?.mensagem || resetCopy.messages.passwordChanged)
    } catch (error) {
      showError(getErrorMessage(error, resetCopy.messages.passwordError))
    } finally {
      setPending(false)
    }
  }

  React.useEffect(() => {
    if (step !== "code" || pending || form.code.length !== CODE_LENGTH) {
      return
    }

    if (autoSubmittedCodeRef.current === form.code) {
      return
    }

    autoSubmittedCodeRef.current = form.code
    validateCode(form.code)
  }, [form.code, pending, step])

  return (
    <section className="min-h-screen bg-background px-4 pb-16 pt-28 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-xl flex-col gap-5">
          <Button asChild variant="ghost" className="w-fit px-0">
            <Link href="/">
              <ArrowLeftIcon data-icon="inline-start" />
              {resetCopy.backHome}
            </Link>
          </Button>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-primary">{resetCopy.eyebrow}</span>
            <h1 className="text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
              {resetCopy.title}
            </h1>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              {resetCopy.subtitle}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {resetCopy.steps.map((item, index) => {
              const active = !completed && stepIndex === index + 1
              const finished = completed || stepIndex > index + 1

              return (
                <div
                  key={item}
                  className={cn(
                    "flex min-h-20 flex-col justify-between rounded-lg border bg-card p-3 text-card-foreground",
                    active ? "border-primary bg-primary/5" : "",
                    finished ? "border-primary/30" : ""
                  )}
                  data-active={active}
                  data-finished={finished}
                >
                  <span className="text-xs text-muted-foreground">
                    {resetCopy.stepLabel} {index + 1}
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {finished ? <CheckCircle2Icon data-icon="inline-start" /> : null}
                    {item}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Card className="w-full max-w-md rounded-lg">
          <CardHeader>
            <CardTitle>{completed ? resetCopy.successTitle : resetCopy.cardTitle}</CardTitle>
            <CardDescription>
              {completed ? resetCopy.successDescription : resetCopy.cardDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {feedback ? (
              <div
                className="rounded-lg border bg-muted/50 px-3 py-2 text-sm"
                data-state={feedback.type}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                {feedback.message}
              </div>
            ) : null}

            {step === "email" ? (
              <form className="flex flex-col gap-4" onSubmit={handleRequestCode}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-email">{resetCopy.fields.email}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={resetCopy.placeholders.email}
                    value={form.email}
                    disabled={pending}
                    onChange={(event) => updateField("email", event.target.value.trim())}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-email-destino">{resetCopy.fields.emailDestino}</Label>
                  <Input
                    id="reset-email-destino"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={resetCopy.placeholders.emailDestino}
                    value={form.emailDestino}
                    disabled={pending}
                    onChange={(event) => updateField("emailDestino", event.target.value.trim())}
                  />
                  <Label className="opacity-45 text-[12px]">Aqui você preenche com o email que você tem acesso</Label>
                </div>

                <Button type="submit" disabled={pending}>
                  <MailIcon data-icon="inline-start" />
                  {pending ? resetCopy.actions.sendingCode : resetCopy.actions.sendCode}
                </Button>
              </form>
            ) : null}

            {step === "code" ? (
              <form className="flex flex-col gap-4" onSubmit={handleValidateCode}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-code-0">{resetCopy.fields.code}</Label>
                  <OtpCodeInput
                    idPrefix="reset-code"
                    value={form.code}
                    disabled={pending}
                    onChange={(value) => updateField("code", value)}
                    aria-label={resetCopy.fields.code}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">{resetCopy.codeHint}</p>
                </div>

                <Button type="submit" disabled={pending}>
                  <KeyRoundIcon data-icon="inline-start" />
                  {pending ? resetCopy.actions.validatingCode : resetCopy.actions.validateCode}
                </Button>
              </form>
            ) : null}

            {step === "password" ? (
              <form className="flex flex-col gap-4" onSubmit={handleRedefinePassword}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-new-password">{resetCopy.fields.novaSenha}</Label>
                  <Input
                    id="reset-new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={resetCopy.placeholders.novaSenha}
                    value={form.novaSenha}
                    disabled={pending}
                    onChange={(event) => updateField("novaSenha", event.target.value)}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">{resetCopy.passwordHint}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="reset-confirm-password">{resetCopy.fields.confirmarSenha}</Label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={resetCopy.placeholders.confirmarSenha}
                    value={form.confirmarSenha}
                    disabled={pending}
                    onChange={(event) => updateField("confirmarSenha", event.target.value)}
                  />
                </div>

                <Button type="submit" disabled={pending}>
                  <LockKeyholeIcon data-icon="inline-start" />
                  {pending ? resetCopy.actions.changingPassword : resetCopy.actions.changePassword}
                </Button>
              </form>
            ) : null}

            {completed ? (
              <div className="flex flex-col gap-3">
                <Button asChild>
                  <Link href="/?login=1" prefetch={false}>{resetCopy.actions.goToLogin}</Link>
                </Button>
                <Button type="button" variant="outline" onClick={resetFlow}>
                  {resetCopy.actions.restart}
                </Button>
              </div>
            ) : null}
          </CardContent>

          {!completed ? (
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button asChild variant="link" className="px-0">
                <Link href="/?login=1" prefetch={false}>{resetCopy.backLogin}</Link>
              </Button>
              {step !== "email" ? (
                <>
                  <Button type="button" variant="outline" onClick={resetFlow} disabled={pending}>
                    {resetCopy.actions.restart}
                  </Button>
                </>
              ) : null}
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </section>
  )
}
