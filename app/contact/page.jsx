"use client";

import { useState, useRef } from "react";

const faqs = [
  { question: "O que é o Orbis?", answer: "O Orbis é uma plataforma completa de gestão e comunicação para empresas e equipes que buscam mais eficiência no dia a dia." },
  { question: "Como posso criar minha conta?", answer: "Basta acessar o site, clicar em 'Criar conta' e preencher seus dados. O processo leva menos de 2 minutos." },
  { question: "O Orbis é gratuito?", answer: "Oferecemos um plano gratuito com funcionalidades essenciais. Para recursos avançados, confira nossos planos pagos." },
  { question: "Como entro em contato com o suporte?", answer: "Você pode entrar em contato pelo WhatsApp, telefone SAC ou pelo e-mail suporte.orbis@gmail.com listados ao lado." },
  { question: "Posso cancelar minha assinatura a qualquer momento?", answer: "Sim, o cancelamento pode ser feito a qualquer momento diretamente pelo painel da sua conta, sem burocracia." },
];

const WhatsAppIcon = ({ size = 46 }) => (
  <img src="/whatsapp-128-svgrepo-com.svg" alt="WhatsApp" width={size} height={size} />
);

const EmailIcon = ({ size = 37 }) => (
  <img src="/email-1572-svgrepo-com.svg" alt="Email" width={size} height={size} />
);

const ChevronIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(90deg)" : "rotate(0deg)",
      transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

function FaqItem({ faq, index, open, onToggle }) {
  const contentRef = useRef(null);

  return (
    <div
      style={{
        borderBottom: "1px solid #f0eaff",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-1 text-left group"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: open ? "#7c3aed" : "#374151",
            transition: "color 0.25s ease",
          }}
        >
          {index + 1}. {faq.question}
        </span>
        <span style={{ color: open ? "#7c3aed" : "#9ca3af", transition: "color 0.25s ease", flexShrink: 0, marginLeft: 8 }}>
          <ChevronIcon open={open} />
        </span>
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: open ? `${contentRef.current?.scrollHeight || 200}px` : "0px",
          opacity: open ? 1 : 0,
          transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease",
          overflow: "hidden",
        }}
      >
        <p
          style={{
            fontSize: "0.8rem",
            color: "#6b7280",
            lineHeight: 1.7,
            padding: "0 4px 14px",
          }}
        >
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

function ContactCard({ href, icon, label, value, delay = 0 }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        border: `2px solid ${hovered ? "#7c3aed" : "#ddd6fe"}`,
        borderRadius: "16px",
        padding: "20px 24px",
        height: "33%",
        textDecoration: "none",
        background: hovered ? "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)" : "#fff",
        transform: hovered ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? "0 12px 40px rgba(124,58,237,0.15)"
          : "0 2px 12px rgba(0,0,0,0.05)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: "1rem", fontWeight: 600, color: "#7c3aed", margin: 0, lineHeight: 1.3 }}>
          {value}
        </p>
        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "3px 0 0", fontWeight: 400 }}>
          {label}
        </p>
      </div>
    </a>
  );
}

function FloatingInput({ placeholder, type = "text", className = "" }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const active = focused || value.length > 0;

  return (
    <div style={{ position: "relative", width: "100%" }} className={className}>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          border: `1.5px solid ${focused ? "#7c3aed" : "#e5e7eb"}`,
          borderRadius: "10px",
          padding: "14px 14px 6px",
          fontSize: "0.875rem",
          color: "#111",
          background: "#fafafa",
          outline: "none",
          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
          boxSizing: "border-box",
          boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
        }}
      />
      <label
        style={{
          position: "absolute",
          left: "14px",
          top: active ? "5px" : "50%",
          transform: active ? "translateY(0)" : "translateY(-50%)",
          fontSize: active ? "0.65rem" : "0.85rem",
          color: focused ? "#7c3aed" : "#9ca3af",
          fontWeight: active ? 500 : 400,
          pointerEvents: "none",
          transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
          letterSpacing: active ? "0.03em" : 0,
        }}
      >
        {placeholder}
      </label>
    </div>
  );
}

function FloatingTextarea({ placeholder }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const active = focused || value.length > 0;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          border: `1.5px solid ${focused ? "#7c3aed" : "#e5e7eb"}`,
          borderRadius: "10px",
          padding: "22px 14px 8px",
          fontSize: "0.875rem",
          color: "#111",
          background: "#fafafa",
          outline: "none",
          resize: "none",
          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
          boxSizing: "border-box",
          boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
          fontFamily: "inherit",
        }}
      />
      <label
        style={{
          position: "absolute",
          left: "14px",
          top: active ? "6px" : "14px",
          fontSize: active ? "0.65rem" : "0.85rem",
          color: focused ? "#7c3aed" : "#9ca3af",
          fontWeight: active ? 500 : 400,
          pointerEvents: "none",
          transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
          letterSpacing: active ? "0.03em" : 0,
        }}
      >
        {placeholder}
      </label>
    </div>
  );
}

export default function ContatoPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "100%",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "90px 120px 24px 24px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "73%",
          display: "flex",
          gap: "28px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >

        {/* LEFT — scrollable panel */}
        <div
          style={{
            flex: "1 1 620px",
            border: "2px solid #ddd6fe",
            borderRadius: "20px",
            overflowY: "auto",
            minHeight: "560px",
            background: "#fff",
            boxShadow: "0 4px 32px rgba(124,58,237,0.07)",
            scrollbarWidth: "thin",
            scrollbarColor: "#ddd6fe transparent",
          }}
        >
          {/* Nos Contate */}
          <div style={{ padding: "36px 32px 28px" }}>
            <img style={{
                width: "70px",
                height: "70px"
            }} src="/connect_icon_contact.svg" alt="" />
            </div>
            

          {/* Divider */}
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #ddd6fe, transparent)", margin: "0 24px" }} />

          {/* Dúvidas Frequentes */}
          <div style={{ padding: "28px 32px 36px" }}>
            <div
              style={{
                display: "inline-block",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 300,
                  color: "#7c3aed",
                  margin: 0,
                }}
              >
                Dúvidas Frequentes
              </h2>
            </div>

            <div>
              {faqs.map((faq, i) => (
                <FaqItem
                  key={i}
                  faq={faq}
                  index={i}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — contact cards */}
        <div
          style={{
            flex: "0 1",
            display: "flex",
            height: "560px",
            flexDirection: "column",
            gap: "14px",
            zIndex: 1,
          }}
        >
          <ContactCard
            href="https://wa.me/5511900000000"
            icon={<WhatsAppIcon />}
            label="Whatsapp"
            value="+55 11 9000-0000"
            delay={0}
          />
          <ContactCard
            href="tel:+5511900000000"
            icon={<WhatsAppIcon />}
            label="SAC"
            value="+55 11 9000-0000"
            delay={80}
          />
          <ContactCard
            href="mailto:suporte.orbis@gmail.com"
            icon={<EmailIcon />}
            label="E-mail"
            value="suporte.orbis@gmail.com"
            delay={160}
          />
        </div>

      </div>
    </div>
  );
}