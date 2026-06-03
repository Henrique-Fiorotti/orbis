"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { loginAction } from "@/app/actions/auth.actions";
import { useLandingLanguage } from "@/components/landing/language-provider";
import { getValidAuthSession, saveAuthSession } from "@/lib/auth-session";

function PrivacyModal({ onClose, privacy, darkMode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  const modalStyles = {
    overlayBg: darkMode ? "rgba(0,0,0,0.42)" : "rgba(15,23,42,0.2)",
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
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      onClick={onClose}
      onWheel={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: modalStyles.overlayBg,
        backdropFilter: "blur(4px)",
        animation: "orbisPrivacyFadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: `1px solid ${modalStyles.border}`,
          borderRadius: "20px",
          background: modalStyles.cardBg,
          boxShadow: modalStyles.shadow,
          animation: "orbisPrivacySlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: "16px",
            padding: "24px 28px 20px",
            borderBottom: `1px solid ${modalStyles.border}`,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: modalStyles.title }}>
              {privacy.title}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: modalStyles.meta }}>
              {privacy.lastUpdated}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={privacy.closeLabel}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `1px solid ${modalStyles.border}`,
              borderRadius: "8px",
              background: modalStyles.buttonBg,
              color: modalStyles.buttonText,
              cursor: "pointer",
              fontSize: "1rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(event) => (event.currentTarget.style.background = modalStyles.buttonHoverBg)}
            onMouseLeave={(event) => (event.currentTarget.style.background = modalStyles.buttonBg)}
          >
            x
          </button>
        </div>

        <div
          style={{
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "24px 28px 28px",
            color: modalStyles.text,
            fontSize: "0.85rem",
            lineHeight: 1.75,
            scrollbarWidth: "thin",
            scrollbarColor: modalStyles.scrollbar,
          }}
        >
          {privacy.sections.map((section, index) => (
            <div key={`${section.title}-${index}`} style={{ marginBottom: "20px" }}>
              <p style={{ margin: "0 0 6px", color: "#8C52ff", fontSize: "0.875rem", fontWeight: 600 }}>
                {section.title}
              </p>
              <p style={{ margin: 0 }}>{section.text}</p>
            </div>
          ))}
        </div>

        <div style={{ flexShrink: 0, padding: "16px 28px", borderTop: `1px solid ${modalStyles.border}` }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "10px",
              padding: "12px",
              background: "#8C52ff",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(event) => (event.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(event) => (event.currentTarget.style.opacity = "1")}
          >
            {privacy.confirm}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes orbisPrivacyFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes orbisPrivacySlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function LoginCard({ isDark }) {
  const { copy } = useLandingLanguage();
  const login = copy.login;
  const { resolvedTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const session = getValidAuthSession();

    if (session) {
      window.location.href = "/dashboard";
    }
  }, []);

  const darkMode = typeof isDark === "boolean" ? isDark : mounted && resolvedTheme === "dark";
  const cardStyles = {
    "--orbis-panel-bg": darkMode ? "rgba(12, 12, 16, 0.68)" : "rgba(255, 255, 255, 0.72)",
    "--orbis-panel-border": darkMode ? "rgba(255,255,255,0.11)" : "rgba(94,23,235,0.14)",
    "--orbis-panel-shadow": darkMode ? "0 30px 90px rgba(0,0,0,0.44)" : "0 30px 90px rgba(84,55,155,0.16)",
    "--orbis-title": darkMode ? "#fafafa" : "#18181b",
    "--orbis-muted": darkMode ? "#a1a1aa" : "#64646d",
    "--orbis-soft": darkMode ? "#71717a" : "#8a8794",
    "--orbis-field-bg": darkMode ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.82)",
    "--orbis-field-focus-bg": darkMode ? "rgba(255,255,255,0.085)" : "#ffffff",
    "--orbis-field-border": darkMode ? "rgba(255,255,255,0.1)" : "rgba(24,24,27,0.1)",
    "--orbis-field-text": darkMode ? "#f4f4f5" : "#18181b",
    "--orbis-field-placeholder": darkMode ? "#66636f" : "#aaa5b6",
    "--orbis-line": darkMode ? "rgba(255,255,255,0.1)" : "rgba(24,24,27,0.08)",
  };

  async function handleSubmit(formData) {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await loginAction(formData);

      if (result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      const session = saveAuthSession(result, { remember: rememberMe });

      if (!session?.accessToken) {
        setErrorMessage(login.sessionError);
        setIsLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : login.sessionError);
      setIsLoading(false);
    }
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    handleSubmit(new FormData(event.currentTarget));
  }

  return (
    <>
      <style>{`
        .orbis-login-surface {
          position: relative;
          width: 100%;
          max-width: 462px;
          color: var(--orbis-title);
          font-family: "DM Sans", "Segoe UI", sans-serif;
        }

        .orbis-login-surface::before {
          content: "";
          position: absolute;
          inset: -1px;
          z-index: 0;
          border-radius: 28px;
          opacity: 0.72;
          pointer-events: none;
        }

        .orbis-login-panel {
          position: relative;
          z-index: 1;
          overflow: hidden;
          border: 1px solid var(--orbis-panel-border);
          border-radius: 10px;
          background: var(--orbis-panel-bg);
          box-shadow: var(--orbis-panel-shadow);
          backdrop-filter: blur(24px) saturate(1.2);
        }

        .orbis-login-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
                    
        }

        .orbis-panel-inner {
          position: relative;
          z-index: 1;
          padding: clamp(28px, 5vw, 38px);
        }

        .orbis-login-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 34px;
        }

        .orbis-logo-lockup {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 12px;
        }

        .orbis-logo-mark {
          display: inline-flex;
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, #7461a8, #5a4a85);
          box-shadow: 0 14px 32px rgba(90, 74, 133, 0.22);
        }

        .orbis-logo-mark img {
          width: 25px;
          height: auto;
          filter: brightness(0) invert(1);
        }

        .orbis-eyebrow {
          margin: 0;
          color: #7c3aed;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .orbis-brand {
          margin: 3px 0 0;
          color: var(--orbis-muted);
          font-size: 14px;
        }

        .orbis-secure-pill {
          display: inline-flex;
          height: 34px;
          flex: 0 0 auto;
          align-items: center;
          gap: 7px;
          border: 1px solid var(--orbis-line);
          border-radius: 999px;
          padding: 0 12px;
          background: rgba(255, 255, 255, 0.18);
          color: var(--orbis-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .orbis-title {
          margin: 0;
          color: var(--orbis-title);
          font-size: clamp(2rem, 5vw, 2.85rem);
          font-weight: 500;
          line-height: 0.98;
          letter-spacing: 0;
        }

        .orbis-sub {
          max-width: 350px;
          margin: 14px 0 0;
          color: var(--orbis-muted);
          font-size: 15px;
          line-height: 1.55;
        }

        .orbis-login-form {
          margin-top: 30px;
        }

        .orbis-field-group {
          display: grid;
          gap: 14px;
        }

        .orbis-field {
          display: grid;
          gap: 8px;
        }

        .orbis-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .orbis-label {
          margin: 0;
          color: var(--orbis-soft);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .orbis-field-shell {
          position: relative;
          display: flex;
          min-height: 54px;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--orbis-field-border);
          border-radius: 10px;
          background: var(--orbis-field-bg);
          padding: 0 14px;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .orbis-field-shell:focus-within {
          background: var(--orbis-field-focus-bg);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.13);
          transform: translateY(-1px);
        }

        .orbis-field-icon {
          flex: 0 0 auto;
          color: #8c52ff;
        }

        .orbis-input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          border: 0;
          outline: none;
          padding: 0;
          background: transparent;
          color: var(--orbis-field-text);
          font-family: "DM Sans", "Segoe UI", sans-serif;
          font-size: 15px;
        }

        .orbis-input::placeholder {
          color: var(--orbis-field-placeholder);
        }

        .orbis-password-toggle {
          display: inline-flex;
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: var(--orbis-soft);
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
        }

        .orbis-password-toggle:hover {
          background: rgba(116, 97, 168, 0.11);
          color: #7461a8;
        }

        .orbis-form-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 14px;
        }

        .orbis-forgot {
          color: #7461a8;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .orbis-forgot:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .orbis-remember {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--orbis-muted);
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          user-select: none;
        }

        .orbis-remember input {
          width: 15px;
          height: 15px;
          accent-color: #8C52ff;
          cursor: pointer;
        }

        .orbis-btn {
          display: inline-flex;
          width: 100%;
          min-height: 54px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          border: 0;
          border-radius: 10px;
          background: #8C52ff;
          
          
          color: #fff;
          cursor: pointer;
          font-family: "DM Sans", "Segoe UI", sans-serif;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.01em;
          transition: transform 0.18s ease, filter 0.18s ease;
        }

        .orbis-btn:hover {
          filter: saturate(1.05) brightness(1.02);
          transform: translateY(-1px);
        }

        .orbis-btn:active {
          transform: translateY(0) scale(0.99);
        }

        .orbis-btn:disabled {
          cursor: wait;
          opacity: 0.92;
          transform: none;
        }

        .orbis-btn-loader {
          animation: orbisSpin 0.75s linear infinite;
        }

        .orbis-login-error {
          margin: 14px 0 0;
          border: 1px solid rgba(239,68,68,0.22);
          border-radius: 14px;
          background: ${darkMode ? "rgba(127,29,29,0.22)" : "rgba(254,242,242,0.9)"};
          color: ${darkMode ? "#fca5a5" : "#b91c1c"};
          padding: 11px 13px;
          font-size: 12px;
          line-height: 1.45;
        }

        .orbis-footer {
          margin: 22px 0 0;
          border-top: 1px solid var(--orbis-line);
          padding-top: 16px;
          background: transparent;
          color: var(--orbis-muted);
          font-size: 12px;
          line-height: 1.55;
          text-align: center;
        }

        .orbis-footer button {
          border: 0;
          background: none;
          color: #8c52ff;
          cursor: pointer;
          font-family: "DM Sans", "Segoe UI", sans-serif;
          font-size: 12px;
          font-weight: 700;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        @keyframes orbisSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 520px) {
          .orbis-panel-inner {
            padding: 24px 20px;
          }

          .orbis-login-header,
          .orbis-form-meta {
            align-items: flex-start;
            flex-direction: column;
          }

          .orbis-secure-pill {
            height: 32px;
          }
        }
      `}</style>

      <div className="orbis-login-surface" style={cardStyles}>
        <div className="orbis-login-panel">
          <div className="orbis-panel-inner">
            
            <h2 className="orbis-title">{login.greeting}</h2>
            <p className="orbis-sub">{login.subtitle}</p>

            <form className="orbis-login-form" onSubmit={handleFormSubmit}>
              <div className="orbis-field-group">
                <div className="orbis-field">
                  <p className="orbis-label">{login.fields.email}</p>
                  <div className="orbis-field-shell">
                    <Mail className="orbis-field-icon" size={18} aria-hidden="true" />
                    <input
                      type="email"
                      className="orbis-input"
                      placeholder="email@gmail.com"
                      id="email"
                      name="email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="orbis-field">
                  <p className="orbis-label">{login.fields.password}</p>
                  <div className="orbis-field-shell">
                    <LockKeyhole className="orbis-field-icon" size={18} aria-hidden="true" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="orbis-input"
                      placeholder="********"
                      id="password"
                      name="password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="orbis-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? login.hidePassword : login.showPassword}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="orbis-form-meta">
                <label className="orbis-remember ms-1" htmlFor="remember-me">
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
                <Link href="/esqueci-senha" prefetch={false} className="orbis-forgot">
                  {login.forgotPassword}
                </Link>
              </div>

              {errorMessage ? (
                <p className="orbis-login-error" role="alert">{errorMessage}</p>
              ) : null}

              <button
                type="submit"
                className="orbis-btn"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <LoaderCircle className="orbis-btn-loader" size={18} aria-hidden="true" />
                ) : (
                  <>
                    <span>{login.submit}</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="orbis-footer">
              {login.privacy.agreementBefore}{" "}
              <button type="button" onClick={() => setShowPrivacy(true)}>
                {login.privacy.linkText}
              </button>
            </p>
          </div>
        </div>
      </div>

      {showPrivacy && (
        <PrivacyModal onClose={() => setShowPrivacy(false)} privacy={login.privacy} darkMode={darkMode} />
      )}
    </>
  );
}
