"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth.actions";
import { useLandingLanguage } from "@/components/landing/language-provider";
import { saveAuthSession } from "@/lib/auth-session";
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useTheme } from "next-themes";
import { getValidAuthSession } from "@/lib/auth-session";

function PrivacyModal({ onClose, privacy, darkMode }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = "hidden"

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }, [])

  const modalStyles = {
    overlayBg: darkMode ? "rgba(0,0,0,0.62)" : "rgba(15,23,42,0.28)",
    cardBg: darkMode ? "#0f0f12" : "#ffffff",
    border: darkMode ? "#27272a" : "#e4e4e7",
    title: darkMode ? "#e4e4e7" : "#18181b",
    meta: "#71717a",
    text: darkMode ? "#a1a1aa" : "#52525b",
    buttonBg: darkMode ? "#18181b" : "#f4f4f5",
    buttonHoverBg: darkMode ? "#27272a" : "#e4e4e7",
    buttonText: darkMode ? "#a1a1aa" : "#52525b",
    shadow: darkMode ? "0 24px 80px rgba(0,0,0,0.5)" : "0 24px 70px rgba(15,23,42,0.2)",
    scrollbar: darkMode ? "#27272a transparent" : "#d4d4d8 transparent",
  }

  return (
    <div
      onClick={onClose}
      onWheel={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: modalStyles.overlayBg,
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: modalStyles.cardBg,
          border: `1px solid ${modalStyles.border}`,
          borderRadius: "20px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: modalStyles.shadow,
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${modalStyles.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: modalStyles.title }}>{privacy.title}</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: modalStyles.meta }}>{privacy.lastUpdated}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={privacy.closeLabel}
            style={{ background: modalStyles.buttonBg, border: `1px solid ${modalStyles.border}`, borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: modalStyles.buttonText, fontSize: "1rem", transition: "background 0.2s", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = modalStyles.buttonHoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = modalStyles.buttonBg)}
          >✕</button>
        </div>

        <div style={{ minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", padding: "24px 28px 28px", fontSize: "0.85rem", color: modalStyles.text, lineHeight: 1.75, scrollbarWidth: "thin", scrollbarColor: modalStyles.scrollbar }}>
          {privacy.sections.map((section, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: 600, color: "#8C52ff", margin: "0 0 6px", fontSize: "0.875rem" }}>{section.title}</p>
              <p style={{ margin: 0 }}>{section.text}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 28px", borderTop: `1px solid ${modalStyles.border}`, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "#8C52ff", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >{privacy.confirm}</button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

export default function LoginCard({isDark}) {
  const { copy } = useLandingLanguage()
  const login = copy.login
  const { resolvedTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [mounted, setMounted] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() =>{
    const session = getValidAuthSession()
    if (session){
      window.location.href = "/dashboard"
    }
  }, [])
  // O [] significa: rode isso UMA VEZ, assim que o componente aparecer na tela

  const darkMode = typeof isDark === "boolean" ? isDark : mounted && resolvedTheme === "dark"
  const cardStyles = {
    "--orbis-card-bg": darkMode ? "#0f0f12" : "#ffffff",
    "--orbis-card-border": darkMode ? "#27272a" : "#e4e4e7",
    "--orbis-card-shadow": darkMode ? "0 8px 40px rgba(0,0,0,0.5)" : "0 18px 45px rgba(15,23,42,0.12)",
    "--orbis-label-color": darkMode ? "#71717a" : "#52525b",
    "--orbis-input-bg": darkMode ? "#18181b" : "#ffffff",
    "--orbis-input-focus-bg": darkMode ? "#1c1c1f" : "#ffffff",
    "--orbis-input-border": darkMode ? "#27272a" : "#d4d4d8",
    "--orbis-input-text": darkMode ? "#e4e4e7" : "#18181b",
    "--orbis-input-placeholder": darkMode ? "#3f3f46" : "#a1a1aa",
    "--orbis-footer-text": darkMode ? "#71717a" : "#6b7280",
  }

  async function handleSubmit(formData) {
    if (isLoading) {
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const result = await loginAction(formData)

      if (result.error) {
        setErrorMessage(result.error)
        setIsLoading(false)
        return
      }

      const session = saveAuthSession(result, { remember: rememberMe })

      if (!session?.accessToken) {
        setErrorMessage(login.sessionError)
        setIsLoading(false)
        return
      }

      window.location.href = "/dashboard"
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : login.sessionError)
      setIsLoading(false)
    }
  }

  function handleFormSubmit(event) {
    event.preventDefault()

    if (isLoading) {
      return
    }

    handleSubmit(new FormData(event.currentTarget))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .orbis-card {
          width: 100%;
          max-width: 420px;
          background: var(--orbis-card-bg);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--orbis-card-shadow);
          font-family: 'DM Sans', sans-serif;
          border: 1px solid var(--orbis-card-border);
        }

        .orbis-top {
          background: #8C52ff;
          padding: 36px 36px 48px;
          position: relative;
          overflow: hidden;
        }

        .orbis-top::before {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 40px solid rgba(255,255,255,0.07);
          top: -60px;
          right: -60px;
        }

        .orbis-top::after {
          content: '';
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 30px solid rgba(255,255,255,0.06);
          bottom: -40px;
          left: 20px;
        }

        .orbis-logo-tag {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin: 0 0 20px;
        }

        .orbis-greeting {
          font-size: 26px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 6px;
          line-height: 1.2;
        }

        .orbis-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.65);
          margin: 0;
        }

        .orbis-body {
          padding: 32px 36px 36px;
        }

        .orbis-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--orbis-label-color);
          margin: 0 0 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .orbis-input {
          width: 100%;
          border: 1px solid var(--orbis-input-border);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: var(--orbis-input-text);
          background: var(--orbis-input-bg);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .orbis-input::placeholder {
          color: var(--orbis-input-placeholder);
        }

        .orbis-input:focus {
          border-color: #8C52ff;
          box-shadow: 0 0 0 3px rgba(140,82,255,0.15);
          background: var(--orbis-input-focus-bg);
        }

        .orbis-btn {
          width: 100%;
          background: #8C52ff;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 13px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          letter-spacing: 0.01em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 46px;
        }

        .orbis-btn:hover { background: #7a3fe0; }
        .orbis-btn:active { transform: scale(0.99); }
        .orbis-btn:disabled {
          cursor: wait;
          background: #7a3fe0;
          opacity: 0.92;
          transform: none;
        }

        .orbis-btn-loader {
          animation: orbisSpin 0.75s linear infinite;
        }

        .orbis-login-error {
          margin: 12px 0 0;
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 10px;
          background: ${darkMode ? "rgba(127,29,29,0.22)" : "rgba(254,242,242,0.9)"};
          color: ${darkMode ? "#fca5a5" : "#b91c1c"};
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.45;
        }

        @keyframes orbisSpin {
          to { transform: rotate(360deg); }
        }

        .orbis-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          font-size: 12px;
          color: var(--orbis-label-color);
          cursor: pointer;
          user-select: none;
        }

        .orbis-remember input {
          width: 15px;
          height: 15px;
          accent-color: #8C52ff;
          cursor: pointer;
        }

        .orbis-footer {
          font-size: 12px;
          color: var(--orbis-footer-text);
          text-align: center;
          margin-top: 20px;
          background: transparent;
        }

        .orbis-footer button {
          background: none;
          border: none;
          color: #8C52ff;
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div className="orbis-card !border-none" style={cardStyles}>
        <div className="orbis-top">
          <img style={{ height: "55px" }} src="LogoBrancaGrande.svg" alt="" />
          <h2 className="orbis-greeting">{login.greeting}</h2>
          <p className="orbis-sub">{login.subtitle}</p>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="orbis-body">
            <div style={{ marginBottom: "16px" }}>
              <p className="orbis-label">{login.fields.email}</p>
              <input type="email" className="orbis-input" placeholder="email@gmail.com"
                id="email"
                name="email"
                required
                disabled={isLoading}
              />
            </div>

            <div style={{ marginBottom: "4px" }}>
              <p className="orbis-label">{login.fields.password}</p>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="orbis-input"
                  placeholder="••••••••"
                  id="password"
                  name="password"
                  required
                  disabled={isLoading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? login.hidePassword : login.showPassword}
                  disabled={isLoading}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: darkMode ? "#52525b" : "#71717a",
                    padding: 0,
                    opacity: isLoading ? 0.55 : 1,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Link href="/esqueci-senha" prefetch={false} style={{ display: "block", fontSize: "12px", color: "#8C52ff", cursor: "pointer", textAlign: "right", marginTop: "6px", fontWeight: 500 }}>
              {login.forgotPassword}
            </Link>

            <label className="orbis-remember" htmlFor="remember-me">
              <input
                id="remember-me"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                disabled={isLoading}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Lembrar de mim</span>
            </label>

            {errorMessage ? (
              <p className="orbis-login-error" role="alert">{errorMessage}</p>
            ) : null}

            <button
              type="submit"
              className="orbis-btn"
              disabled={isLoading}
              aria-busy={isLoading}
              style={{ marginTop: "20px" }}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="orbis-btn-loader" size={18} aria-hidden="true" />
                  {/* <span>Validando acesso</span> */}
                </>
              ) : login.submit}
            </button>
          </div>
        </form>

        <p className="orbis-footer w-85 m-auto mb-4 text-center justify-center items-center">
          {login.privacy.agreementBefore}{" "}
          <button onClick={() => setShowPrivacy(true)}>{login.privacy.linkText}</button>
        </p>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} privacy={login.privacy} darkMode={darkMode} />}
    </>
  );
}
