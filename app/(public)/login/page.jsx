"use client";

import { useState } from "react";

function PrivacyModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
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
          background: "#fff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "#111",
              }}
            >
              Política de Privacidade
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.75rem",
                color: "#9ca3af",
              }}
            >
              Última atualização: março de 2025
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
              fontSize: "1rem",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            overflowY: "auto",
            padding: "24px 28px 28px",
            fontSize: "0.85rem",
            color: "#374151",
            lineHeight: 1.75,
            scrollbarWidth: "thin",
            scrollbarColor: "#ddd6fe transparent",
          }}
        >
          {[
            {
              title: "1. Informações que coletamos",
              text: "Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail e dados de acesso ao criar uma conta ou entrar em contato conosco. Também podemos coletar dados de uso automaticamente, como endereço IP, tipo de navegador e páginas visitadas.",
            },
            {
              title: "2. Como usamos suas informações",
              text: "Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, enviar comunicações relacionadas à conta, responder às suas solicitações e garantir a segurança da plataforma. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.",
            },
            {
              title: "3. Armazenamento e segurança",
              text: "Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. Adotamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração ou destruição.",
            },
            {
              title: "4. Cookies",
              text: "Utilizamos cookies para manter sua sessão ativa e entender como você interage com a plataforma. Você pode desativar os cookies no seu navegador, mas isso pode afetar o funcionamento de alguns recursos do Orbis.",
            },
            {
              title: "5. Seus direitos",
              text: "Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos, entre em contato com nossa equipe pelo e-mail suporte.orbis@gmail.com. Atenderemos sua solicitação no prazo previsto pela legislação aplicável.",
            },
            {
              title: "6. Retenção de dados",
              text: "Mantemos seus dados pelo tempo necessário para a prestação dos serviços ou conforme exigido por lei. Após o encerramento da sua conta, podemos reter algumas informações para cumprir obrigações legais ou resolver disputas.",
            },
            {
              title: "7. Alterações nesta política",
              text: "Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por e-mail ou por um aviso em destaque na plataforma. O uso continuado do Orbis após tais alterações constitui sua aceitação da nova política.",
            },
            {
              title: "8. Contato",
              text: "Em caso de dúvidas sobre esta política ou sobre como tratamos seus dados, entre em contato com nosso encarregado de proteção de dados pelo e-mail suporte.orbis@gmail.com.",
            },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <p
                style={{
                  fontWeight: 600,
                  color: "#7c3aed",
                  margin: "0 0 6px",
                  fontSize: "0.875rem",
                }}
              >
                {section.title}
              </p>
              <p style={{ margin: 0 }}>{section.text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #f3f4f6",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Entendi
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [focusedEmail, setFocusedEmail] = useState(false);
  const [focusedSenha, setFocusedSenha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          display: "flex",
          alignItems: "center",
          gap: "64px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* LEFT — branding */}
        <div style={{ flex: "1 1 auto", minWidth: "220px", height: "100%" }}>
          <h1
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "clamp(3.7rem, 5vw, 3.2rem)",
              fontWeight: 100,
              color: "#111",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            Entre no <span style={{ color: "#7c3aed" }}>Orbis</span>
          </h1>
          <p
            style={{
              marginTop: "16px",
              fontSize: "1.95rem",
              color: "#9ca3af",
              fontWeight: 400,
              lineHeight: 1.0,
              maxWidth: "280px",
            }}
          >
            Gerencie sua equipe, automatize processos e tenha tudo em um só
            lugar.
          </p>
        </div>

        {/* RIGHT — login card */}
        <div
          style={{
            flex: "0 1 420px",
            width: "100%",
            background: "#fff",
            border: "2px solid #ddd6fe",
            borderRadius: "20px",
            padding: "44px 40px 36px",
            boxShadow: "0 8px 40px rgba(124,58,237,0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 400,
              color: "#7c3aed",
              textAlign: "center",
              margin: "0 0 32px",
              letterSpacing: "-0.3px",
            }}
          >
            Faça seu login
          </h2>

          {/* Email */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#6b7280",
                marginBottom: "6px",
                letterSpacing: "0.02em",
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedEmail(true)}
              onBlur={() => setFocusedEmail(false)}
              style={{
                width: "100%",
                border: `2px solid ${focusedEmail ? "#7c3aed" : "#e5e7eb"}`,
                borderRadius: "10px",
                padding: "13px 16px",
                fontSize: "0.9rem",
                color: "#111",
                background: "#fafafa",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                boxShadow: focusedEmail
                  ? "0 0 0 4px rgba(124,58,237,0.1)"
                  : "none",
              }}
            />
          </div>

          {/* Senha */}
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                fontWeight: 500,
                color: "#6b7280",
                marginBottom: "6px",
                letterSpacing: "0.02em",
              }}
            >
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onFocus={() => setFocusedSenha(true)}
                onBlur={() => setFocusedSenha(false)}
                style={{
                  width: "100%",
                  border: `2px solid ${focusedSenha ? "#7c3aed" : "#e5e7eb"}`,
                  borderRadius: "10px",
                  padding: "13px 44px 13px 16px",
                  fontSize: "0.9rem",
                  color: "#111",
                  background: "#fafafa",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                  boxShadow: focusedSenha
                    ? "0 0 0 4px rgba(124,58,237,0.1)"
                    : "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Esqueci senha */}
          <div style={{ textAlign: "right", marginBottom: "28px" }}>
            <a
              href="#"
              style={{
                fontSize: "0.8rem",
                color: "#7c3aed",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Esqueci minha senha
            </a>
          </div>

          {/* Botão Entrar */}
          <button
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.03em",
              boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
              transition:
                "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease",
              marginBottom: "20px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
              e.currentTarget.style.boxShadow =
                "0 10px 30px rgba(124,58,237,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(124,58,237,0.35)";
            }}
          >
            Entrar
          </button>

          {/* Política de privacidade */}
          <p
            style={{
              fontSize: "0.78rem",
              color: "#9ca3af",
              textAlign: "center",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Ao entrar, você concorda com nossa{" "}
            <button
              onClick={() => setShowPrivacy(true)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#7c3aed",
                fontSize: "0.78rem",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                fontFamily: "inherit",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Política de Privacidade
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
