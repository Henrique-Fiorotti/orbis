/* ta feito */

"use client";

import { useState } from "react";
import { User, UserCircle, UserRound } from "lucide-react"

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
  const [isLogin, setIsLogin] = useState(true)
  return (

    <>
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="w-1/2 h-120 rounded-2xl shadow-lg flex overflow-hidden relative">

          {/* Form de Login */}
          <div className={`absolute top-0 h-full w-1/2 flex flex-col transition-all duration-500
          ${isLogin ? 'left-0 opacity-100' : '-left-1/2 opacity-0 pointer-events-none'}`}>

            <h1 className="text-left px-6 pt-6 text-black font-medium text-2xl">Login</h1>
            <p className="text-left px-6 mb-1 text-gray-400">Que bom te ver por aqui novamente!</p>

            <div className="w-full flex px-6 flex-col mt-4 gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-gray-400 text-sm m-0">Email</p>
                <input
                  type="email"
                  placeholder="email@gmail.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#2e2e2e] outline-none focus:border-[#8C52ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-gray-400 text-sm m-0">Senha</p>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#2e2e2e] outline-none focus:border-[#8C52ff]"
                />
              </div>

              <p className="text-[#8C52ff] text-sm cursor-pointer">Esqueceu a senha?</p>

              <button
                style={{ borderRadius: '10px' }}
                className="w-full bg-[#8C52ff] text-white py-2 font-medium hover:bg-[#7a3fe0] transition-colors mt-1">
                Entrar
              </button>

              <p className="text-xs text-gray-400  text-center px-6 leading-relaxed">
                Ao continuar, você concorda com nossa{" "}
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="underline underline-offset-2 bg-transparent border-none cursor-pointer text-xs text-[#8c52ff] hover:opacity-65 transition-opacity">
                  Política de Privacidade
                </button>
              </p>
            </div>
          </div>

          {/* Form de Cadastro */}
          <div className={`absolute top-0 h-full w-1/2 flex flex-col transition-all duration-500
          ${isLogin ? 'right-[-50%] opacity-0 pointer-events-none' : 'right-0 opacity-100'}`}>

            <h1 className="text-left px-6 pt-6 text-black font-medium text-2xl">Cadastro</h1>
            <p className="text-left px-6 mb-1 text-gray-400">Crie sua conta agora!</p>

            <div className="w-full flex px-6 flex-col mt-4 gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-gray-400 text-sm m-0">Nome</p>
                <input
                  type="text"
                  placeholder="Seu nome"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#2e2e2e] outline-none focus:border-[#8C52ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-gray-400 text-sm m-0">Email</p>
                <input
                  type="email"
                  placeholder="email@gmail.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#2e2e2e] outline-none focus:border-[#8C52ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-gray-400 text-sm m-0">Senha</p>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#2e2e2e] outline-none focus:border-[#8C52ff]"
                />
              </div>

              <button
                style={{ borderRadius: '10px' }}
                className="w-full bg-[#8C52ff] text-white py-2 font-medium hover:bg-[#7a3fe0] transition-colors mt-1">
                Criar conta
              </button>

              <p className="text-xs text-gray-400  text-center px-6 leading-relaxed">
                Ao continuar, você concorda com nossa{" "}
                <button className="underline underline-offset-2 bg-transparent border-none cursor-pointer text-xs text-[#8c52ff] hover:opacity-65 transition-opacity">
                  Política de Privacidade
                </button>
              </p>
            </div>
          </div>

          {/* Painel roxo */}
          <div className={`absolute top-0 h-full w-1/2 bg-[#8C52ff] flex flex-col items-center justify-center gap-4
          transition-all duration-500 ease-in-out z-10
          ${isLogin
              ? 'right-0 rounded-tl-[60px] rounded-bl-[60px] rounded-tr-none rounded-br-none'
              : 'right-120 rounded-tr-[60px] rounded-br-[60px] rounded-tl-none rounded-bl-none'}`}>

            <UserCircle size={64} color="white" strokeWidth={1.2} />

            <div className="flex flex-col items-center gap-1">
              <p className="text-white font-medium text-lg m-0">
                {isLogin ? 'Bem-vindo!' : 'Já tem conta?'}
              </p>
              <p className="text-white/70 text-sm m-0">
                {isLogin ? 'Não tem conta ainda?' : 'Faça login agora!'}
              </p>
            </div>

            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ borderRadius: '10px' }}
              className="border border-white text-white text-sm px-6 py-2 hover:scale-[1.03] transition-all duration-200 hover:text-[#8C52ff] transition-colors">
              {isLogin ? 'Cadastre-se' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>

  );
}
