"use client";

import { useEffect, useState } from "react";
import { loginAction } from "@/app/actions/auth.actions";
import { saveAuthSession } from "@/lib/auth-session";
import { formatRoleLabel } from "@/lib/user-models";
import { Eye, EyeOff } from 'lucide-react'
import { useTheme } from "next-themes";

function PrivacyModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
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
          background: "#0f0f12",
          border: "1px solid #27272a",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "#e4e4e7" }}>Política de Privacidade</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#52525b" }}>Última atualização: março de 2025</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a", fontSize: "1rem", transition: "background 0.2s", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#27272a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#18181b")}
          >✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "24px 28px 28px", fontSize: "0.85rem", color: "#a1a1aa", lineHeight: 1.75, scrollbarWidth: "thin", scrollbarColor: "#27272a transparent" }}>
          {[
            { title: "1. Informações que coletamos", text: "Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail e dados de acesso ao criar uma conta ou entrar em contato conosco." },
            { title: "2. Como usamos suas informações", text: "Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, enviar comunicações relacionadas à conta e garantir a segurança da plataforma." },
            { title: "3. Armazenamento e segurança", text: "Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso." },
            { title: "4. Cookies", text: "Utilizamos cookies para manter sua sessão ativa e entender como você interage com a plataforma." },
            { title: "5. Seus direitos", text: "Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento pelo e-mail suporte.orbis@gmail.com." },
            { title: "6. Retenção de dados", text: "Mantemos seus dados pelo tempo necessário para a prestação dos serviços ou conforme exigido por lei." },
            { title: "7. Alterações nesta política", text: "Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por e-mail." },
            { title: "8. Contato", text: "Dúvidas? Entre em contato pelo e-mail suporte.orbis@gmail.com." },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: 600, color: "#8C52ff", margin: "0 0 6px", fontSize: "0.875rem" }}>{section.title}</p>
              <p style={{ margin: 0 }}>{section.text}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid #27272a", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "#8C52ff", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >Entendi</button>
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
  const { resolvedTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    const result = await loginAction(formData)
    if (result.error) {
      alert(result.error)
      return
    }

    const session = saveAuthSession(result)

    if (!session?.accessToken) {
      alert("Login realizado, mas nao foi possivel iniciar a sessao.")
      return
    }

    const roleLabel = formatRoleLabel(session.role)
    console.info(`[auth] Sessao iniciada para ${roleLabel.toLowerCase()}.`)
    window.location.href = "/dashboard"
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
        }

        .orbis-btn:hover { background: #7a3fe0; }
        .orbis-btn:active { transform: scale(0.99); }

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

      <div className="orbis-card" style={cardStyles}>
        <div className="orbis-top">
          <img style={{ height: "55px" }} src="LogoBrancaGrande.svg" alt="" />
          <h2 className="orbis-greeting">Bem-vindo de volta</h2>
          <p className="orbis-sub">Acesse sua conta para continuar</p>
        </div>

        <form action={handleSubmit}>
          <div className="orbis-body">
            <div style={{ marginBottom: "16px" }}>
              <p className="orbis-label">Email</p>
              <input type="email" className="orbis-input" placeholder="email@gmail.com"
                id="email"
                name="email"
                required
              />
            </div>

            <div style={{ marginBottom: "4px" }}>
              <p className="orbis-label">Senha</p>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="orbis-input"
                  placeholder="••••••••"
                  id="password"
                  name="password"
                  required
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "#8C52ff", cursor: "pointer", textAlign: "right", marginTop: "6px", fontWeight: 500 }}>
              Esqueceu a senha?
            </p>

            <button type="submit" className="orbis-btn" style={{ marginTop: "20px" }}>Entrar</button>
          </div>
        </form>

        <p className="orbis-footer w-85 m-auto mb-4 text-center justify-center items-center">
          Ao continuar, você concorda com nossa{" "}
          <button onClick={() => setShowPrivacy(true)}>Política de Privacidade</button>
        </p>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  );
}
