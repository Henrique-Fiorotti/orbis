"use client";

import { useState } from "react";
import {loginAction} from "@/app/actions/auth.actions";

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
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "#111" }}>Política de Privacidade</h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>Última atualização: março de 2025</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#f3f4f6", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: "1rem", transition: "background 0.2s", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          >✕</button>
        </div>

        <div style={{ overflowY: "auto", padding: "24px 28px 28px", fontSize: "0.85rem", color: "#374151", lineHeight: 1.75, scrollbarWidth: "thin", scrollbarColor: "#ddd6fe transparent" }}>
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
              <p style={{ fontWeight: 600, color: "#7c3aed", margin: "0 0 6px", fontSize: "0.875rem" }}>{section.title}</p>
              <p style={{ margin: 0 }}>{section.text}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid #f3f4f6", flexShrink: 0 }}>
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

export default function LoginCard() {
  const [showPrivacy, setShowPrivacy] = useState(false);

  async function handleSubmit(formData) {
  
    // Chama o Server Action — roda no servidor, nunca expõe a API_URL
    const result = await loginAction(formData)

    if (result.error) {
      alert(result.error)
      return
    }

    if(result){
      alert("Login bem-sucedido!");
      window.location.href = "/dashboard";
    }
  }


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .orbis-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          font-family: 'DM Sans', sans-serif;
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
          color: #9ca3af;
          margin: 0 0 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .orbis-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #2e2e2e;
          background: #f9fafb;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .orbis-input:focus {
          border-color: #8C52ff;
          box-shadow: 0 0 0 3px rgba(140,82,255,0.12);
          background: #fff;
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
          color: #9ca3af;
          text-align: center;
          margin-top: 20px;
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

      <div className="orbis-card">
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
              <input type="password" className="orbis-input" placeholder="••••••••"
                id="password"
                name="password"
                required
              />
            </div>


            <p style={{ fontSize: "12px", color: "#8C52ff", cursor: "pointer", textAlign: "right", marginTop: "6px", fontWeight: 500 }}>
              Esqueceu a senha?
            </p>

            <button type="submit" className="orbis-btn" style={{ marginTop: "20px" }}>Entrar</button>

            <p className="orbis-footer">
              Ao continuar, você concorda com nossa{" "}
              <button onClick={() => setShowPrivacy(true)}>Política de Privacidade</button>
            </p>
          </div>
        </form>
      </div >


      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />
      }
    </>
  );
}