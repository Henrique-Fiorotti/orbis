"use client";

import { useState } from "react";
import { UserCircle } from "lucide-react";

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
        {/* Header da politica de privacidade */}
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
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "#111" }}>
              Política de Privacidade
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
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
            { title: "1. Informações que coletamos", text: "Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail e dados de acesso ao criar uma conta ou entrar em contato conosco. Também podemos coletar dados de uso automaticamente, como endereço IP, tipo de navegador e páginas visitadas." },
            { title: "2. Como usamos suas informações", text: "Utilizamos suas informações para fornecer, manter e melhorar nossos serviços, enviar comunicações relacionadas à conta, responder às suas solicitações e garantir a segurança da plataforma. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing." },
            { title: "3. Armazenamento e segurança", text: "Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. Adotamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração ou destruição." },
            { title: "4. Cookies", text: "Utilizamos cookies para manter sua sessão ativa e entender como você interage com a plataforma. Você pode desativar os cookies no seu navegador, mas isso pode afetar o funcionamento de alguns recursos do Orbis." },
            { title: "5. Seus direitos", text: "Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento. Para exercer esses direitos, entre em contato com nossa equipe pelo e-mail suporte.orbis@gmail.com." },
            { title: "6. Retenção de dados", text: "Mantemos seus dados pelo tempo necessário para a prestação dos serviços ou conforme exigido por lei. Após o encerramento da sua conta, podemos reter algumas informações para cumprir obrigações legais ou resolver disputas." },
            { title: "7. Alterações nesta política", text: "Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por e-mail ou por um aviso em destaque na plataforma." },
            { title: "8. Contato", text: "Em caso de dúvidas sobre esta política ou sobre como tratamos seus dados, entre em contato com nosso encarregado de proteção de dados pelo e-mail suporte.orbis@gmail.com." },
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <p style={{ fontWeight: 600, color: "#7c3aed", margin: "0 0 6px", fontSize: "0.875rem" }}>
                {section.title}
              </p>
              <p style={{ margin: 0 }}>{section.text}</p>
            </div>
          ))}
        </div>

        {/* Botão da politica de privacidade */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #f3f4f6", flexShrink: 0 }}>
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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      <style>{`
        .login-card {
          position: relative;
          width: 100%;
          max-width: 880px;
          margin: 0 16px;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          overflow: hidden;
          /* Mobile: altura automática, empilhado */
          display: flex;
          flex-direction: column;
          min-height: 640px;
        }

        /* Desktop: lado a lado */
        @media (min-width: 640px) {
          .login-card {
            flex-direction: row;
            min-height: 440px;
            height: 440px;
          }
        }

        /* ── Formulários ── */
        .form-panel {
          position: absolute;
          width: 100%;
          display: flex;
          flex-direction: column;
          transition: all 0.5s ease;
          background: #fff;
        }

        /* Mobile: ocupa metade da altura (inferior), painel roxo fica em cima */
        @media (max-width: 639px) {
          .form-panel {
            bottom: 0;
            height: 65%;
          }
          .form-login-active   {justify-content:center; left: 0; opacity: 1; pointer-events: auto; }
          .form-login-inactive {justify-content:center; left: -100%; opacity: 0; pointer-events: none; }
          .form-cadastro-active   { left: 0; opacity: 1; pointer-events: auto; }
          .form-cadastro-inactive { left: 100%; opacity: 0; pointer-events: none; }
        }

        /* Desktop: ocupa metade da largura (esquerda), painel roxo vai pra direita */
        @media (min-width: 640px) {
          .form-panel {
            top: 0;
            height: 100%;
            width: 50%;
          }
          .form-login-active   {justify-content:center; left: 0; opacity: 1; pointer-events: auto; }
          .form-login-inactive {justify-content:center; left: -50%; opacity: 0; pointer-events: none; }
          .form-cadastro-active   { right: 0; opacity: 1; pointer-events: auto; }
          .form-cadastro-inactive { right: -50%; opacity: 0; pointer-events: none; }
        }

        /* ── Painel roxo ── */
        .purple-panel {
          position: absolute;
          background: #8C52ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          transition: all 0.5s ease-in-out;
          z-index: 10;
        }

        /* Mobile: painel roxo fica no topo (35% da altura) */
        @media (max-width: 639px) {
          .purple-panel {
            top: 0;
            left: 0;
            width: 100%;
            height: 35%;
          }
          .purple-login    { border-radius: 0 0 50px 50px; }
          .purple-cadastro { border-radius: 0 0 50px 50px; }
        }

        /* Desktop: painel roxo fica na direita (50% da largura) */
        @media (min-width: 640px) {
          .purple-panel {
            top: 0;
            height: 100%;
            width: 50%;
          }
          .purple-login {
            right: 0;
            border-radius: 60px 0 0 60px;
          }
          .purple-cadastro {
            right: 50%;
            border-radius: 0 60px 60px 0;
          }
        }

        .input-field {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 16px;
          color: #2e2e2e;
          outline: none;
          font-size: 0.9rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .input-field:focus { border-color: #8C52ff; }

        .btn-primary {
          width: 100%;
          background: #8C52ff;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 4px;
        }
        .btn-primary:hover { background: #7a3fe0; }

        .btn-outline {
          border: 1px solid white;
          color: white;
          background: transparent;
          border-radius: 10px;
          font-size: 0.85rem;
          padding: 8px 24px;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
        }
        .btn-outline:hover {
          background: white;
          color: #8C52ff;
          transform: scale(1.03);
        }
      `}</style>

      <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}> {/* tudo isso pra garantir que o card fique centralizado no mobile */}
        <div className="login-card">

          {/* Form de Login */}
          <div className={`form-panel ${isLogin ? "form-login-active" : "form-login-inactive"}`}>
            <h1 style={{ margin: "24px 24px 0", fontSize: "1.4rem", fontWeight: 600, color: "#111" }}>Login</h1>
            <p style={{ margin: "4px 24px 0", color: "#9ca3af", fontSize: "0.85rem" }}>Que bom te ver por aqui novamente!</p>

            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.8rem" }}>Email</p>
                <input type="email" placeholder="email@gmail.com" className="input-field" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.8rem" }}>Senha</p>
                <input type="password" placeholder="••••••••" className="input-field" />
              </div>
              <p style={{ margin: 0, color: "#8C52ff", fontSize: "0.8rem", cursor: "pointer" }}>Esqueceu a senha?</p>
              <button className="btn-primary">Entrar</button>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textAlign: "center" }}>
                Ao continuar, você concorda com nossa{" "}
                <button onClick={() => setShowPrivacy(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C52ff", fontSize: "0.72rem", textDecoration: "underline", padding: 0 }}>
                  Política de Privacidade
                </button>
              </p>
            </div>
          </div>

          {/* Form de Cadastro */}
          <div className={`form-panel ${isLogin ? "form-cadastro-inactive" : "form-cadastro-active"}`}>
            <h1 style={{ margin: "24px 24px 0", fontSize: "1.4rem", fontWeight: 600, color: "#111" }}>Cadastro</h1>
            <p style={{ margin: "4px 24px 0", color: "#9ca3af", fontSize: "0.85rem" }}>Crie sua conta agora!</p>

            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.8rem" }}>Nome</p>
                <input type="text" placeholder="Seu nome" className="input-field" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.8rem" }}>Email</p>
                <input type="email" placeholder="email@gmail.com" className="input-field" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.8rem" }}>Senha</p>
                <input type="password" placeholder="••••••••" className="input-field" />
              </div>
              <button className="btn-primary">Criar conta</button>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textAlign: "center" }}>
                Ao continuar, você concorda com nossa{" "}
                <button onClick={() => setShowPrivacy(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C52ff", fontSize: "0.72rem", textDecoration: "underline", padding: 0 }}>
                  Política de Privacidade
                </button>
              </p>
            </div>
          </div>

          {/* Painel roxo */}
          <div className={`purple-panel ${isLogin ? "purple-login" : "purple-cadastro"}`}>
            <UserCircle size={52} color="white" strokeWidth={1.2} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <p style={{ margin: 0, color: "white", fontWeight: 600, fontSize: "1rem" }}>
                {isLogin ? "Bem-vindo!" : "Já tem conta?"}
              </p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", textAlign: "center", padding: "0 16px" }}>
                {isLogin ? "Ainda não tem uma conta por aqui?" : "Já tem uma conta? Entre agora mesmo!"}
              </p>
            </div>
            <button className="btn-outline" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Cadastre-se" : "Entrar"}
            </button>
          </div>

        </div>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  );
}