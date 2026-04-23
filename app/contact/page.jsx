"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

const faqs = [
  {
    question: "O que é o Orbis?",
    answer:
      "O Orbis é uma plataforma completa de gestão e comunicação para empresas e equipes que buscam mais eficiência no dia a dia.",
  },
  {
    question: "Como posso criar minha conta?",
    answer:
      "Basta acessar o site, clicar em 'Criar conta' e preencher seus dados. O processo leva menos de 2 minutos.",
  },
  {
    question: "O Orbis é gratuito?",
    answer:
      "Oferecemos um plano gratuito com funcionalidades essenciais. Para recursos avançados, confira nossos planos pagos.",
  },
  {
    question: "Como entro em contato com o suporte?",
    answer:
      "Você pode entrar em contato pelo WhatsApp, telefone SAC ou pelo e-mail suporte.orbis@gmail.com listados ao lado.",
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer:
      "Sim, o cancelamento pode ser feito a qualquer momento diretamente pelo painel da sua conta, sem burocracia.",
  },
];

const themeColors = {
  light: {
    pageBg: "#ffffff",
    panelBg: "#ffffff",
    panelBorder: "#ddd6fe",
    panelShadow: "0 4px 32px rgba(124,58,237,0.07)",
    divider: "#ddd6fe",
    faqBorder: "#f0eaff",
    text: "#374151",
    muted: "#9ca3af",
    answer: "#6b7280",
    cardBg: "#ffffff",
    cardBgHover: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)",
    cardBorder: "#ddd6fe",
    cardShadow: "0 2px 12px rgba(0,0,0,0.05)",
    cardShadowHover: "0 12px 40px rgba(124,58,237,0.15)",
    inputBg: "#fafafa",
    inputBorder: "#e5e7eb",
    inputText: "#111111",
    inputPlaceholder: "#9ca3af",
  },
  dark: {
    pageBg: "#09090b",
    panelBg: "#111114",
    panelBorder: "rgba(167,139,250,0.22)",
    panelShadow: "0 14px 40px rgba(0,0,0,0.38)",
    divider: "rgba(167,139,250,0.28)",
    faqBorder: "rgba(255,255,255,0.08)",
    text: "#e4e4e7",
    muted: "#a1a1aa",
    answer: "#d4d4d8",
    cardBg: "#18181b",
    cardBgHover:
      "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(39,39,42,0.95) 100%)",
    cardBorder: "rgba(167,139,250,0.2)",
    cardShadow: "0 2px 16px rgba(0,0,0,0.28)",
    cardShadowHover: "0 18px 40px rgba(124,58,237,0.18)",
    inputBg: "#18181b",
    inputBorder: "#27272a",
    inputText: "#f5f5f5",
    inputPlaceholder: "#71717a",
  },
};

const WhatsAppIcon = ({ size = 46, isDark = false }) => (
  <img
    src="/whatsapp-128-svgrepo-com.svg"
    alt="WhatsApp"
    width={size}
    height={size}
    style={{
      filter: isDark ? "brightness(0) invert(1)" : "none",
      transition: "filter 0.25s ease",
    }}
  />
);

const EmailIcon = ({ size = 37, isDark = false }) => (
  <img
    src="/email-1572-svgrepo-com.svg"
    alt="Email"
    width={size}
    height={size}
    style={{
      filter: isDark ? "brightness(0) invert(1)" : "none",
      transition: "filter 0.25s ease",
    }}
  />
);

const ChevronIcon = ({ open }) => (
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
        borderBottom: "1px solid var(--contact-faq-border)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between px-1 py-3 text-left"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: open ? "#7c3aed" : "var(--contact-text)",
            transition: "color 0.25s ease",
          }}
        >
          {index + 1}. {faq.question}
        </span>
        <span
          style={{
            color: open ? "#7c3aed" : "var(--contact-muted)",
            transition: "color 0.25s ease",
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
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
            color: "var(--contact-answer)",
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
        flex: "1 1 0",
        border: hovered
          ? "2px solid #7c3aed"
          : "2px solid var(--contact-card-border)",
        borderRadius: "16px",
        padding: "20px 24px",
        width: "100%",
        minHeight: "calc((100% - 28px) / 3)",
        textDecoration: "none",
        background: hovered
          ? "var(--contact-card-bg-hover)"
          : "var(--contact-card-bg)",
        boxShadow: hovered
          ? "var(--contact-card-shadow-hover)"
          : "var(--contact-card-shadow)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <p
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#7c3aed",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {value}
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--contact-muted)",
            margin: "3px 0 0",
            fontWeight: 400,
          }}
        >
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
          border: focused
            ? "1.5px solid #7c3aed"
            : "1.5px solid var(--contact-input-border)",
          borderRadius: "10px",
          padding: "14px 14px 6px",
          fontSize: "0.875rem",
          color: "var(--contact-input-text)",
          background: "var(--contact-input-bg)",
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
          color: focused ? "#7c3aed" : "var(--contact-input-placeholder)",
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
          border: focused
            ? "1.5px solid #7c3aed"
            : "1.5px solid var(--contact-input-border)",
          borderRadius: "10px",
          padding: "22px 14px 8px",
          fontSize: "0.875rem",
          color: "var(--contact-input-text)",
          background: "var(--contact-input-bg)",
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
          color: focused ? "#7c3aed" : "var(--contact-input-placeholder)",
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
  const { resolvedTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colors = mounted && resolvedTheme === "dark"
    ? themeColors.dark
    : themeColors.light;
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className="px-4 pb-16 pt-28 sm:px-6 md:px-8 lg:px-10"
      style={{
        "--contact-page-bg": colors.pageBg,
        "--contact-panel-bg": colors.panelBg,
        "--contact-panel-border": colors.panelBorder,
        "--contact-panel-shadow": colors.panelShadow,
        "--contact-divider": colors.divider,
        "--contact-faq-border": colors.faqBorder,
        "--contact-text": colors.text,
        "--contact-muted": colors.muted,
        "--contact-answer": colors.answer,
        "--contact-card-bg": colors.cardBg,
        "--contact-card-bg-hover": colors.cardBgHover,
        "--contact-card-border": colors.cardBorder,
        "--contact-card-shadow": colors.cardShadow,
        "--contact-card-shadow-hover": colors.cardShadowHover,
        "--contact-input-bg": colors.inputBg,
        "--contact-input-border": colors.inputBorder,
        "--contact-input-text": colors.inputText,
        "--contact-input-placeholder": colors.inputPlaceholder,
        minHeight: "100vh",
        maxWidth: "100%",
        background: "var(--contact-page-bg)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
    >
      <div
        className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]"
        style={{
          alignItems: "stretch",
        }}
      >
        <div
          className="min-w-0"
          style={{
            border: "2px solid var(--contact-panel-border)",
            borderRadius: "20px",
            overflowY: "auto",
            minHeight: "clamp(480px, 68vh, 720px)",
            background: "var(--contact-panel-bg)",
            boxShadow: "var(--contact-panel-shadow)",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--contact-panel-border) transparent",
            transition:
              "background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
          }}
        >
          <div style={{ padding: "36px 32px 28px" }}>
            <img
              style={{
                width: "70px",
                height: "70px",
              }}
              src="/connect_icon_contact.svg"
              alt=""
            />
          </div>

          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(to right, transparent, var(--contact-divider), transparent)",
              margin: "0 24px",
            }}
          />

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

        <div
          className="min-w-0 xl:sticky xl:top-28"
          style={{
            display: "flex",
            minHeight: "clamp(420px, 68vh, 720px)",
            flexDirection: "column",
            gap: "14px",
            zIndex: 1,
          }}
        >
          <ContactCard
            href="https://wa.me/5511900000000"
            icon={<WhatsAppIcon isDark={isDark} />}
            label="Whatsapp"
            value="+55 11 9000-0000"
            delay={0}
          />
          <ContactCard
            href="tel:+5511900000000"
            icon={<WhatsAppIcon isDark={isDark} />}
            label="SAC"
            value="+55 11 9000-0000"
            delay={80}
          />
          <ContactCard
            href="mailto:suporte.orbis@gmail.com"
            icon={<EmailIcon isDark={isDark} />}
            label="E-mail"
            value="suporte.orbis@gmail.com"
            delay={160}
          />
        </div>
      </div>
    </div>
  );
}
