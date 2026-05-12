"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon, SendIcon } from "lucide-react";

import { useLandingLanguage } from "@/components/landing/language-provider";
import { sendContactMessage } from "@/lib/contact-api";

const INITIAL_CONTACT_FORM = {
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
};

const CONTACT_STATUS = {
    idle: "",
    success: "success",
    error: "error",
};

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
    },
};

const WhatsAppIcon = ({ size = 30, isDark = false }) => (
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

const EmailIcon = ({ size = 30, isDark = false }) => (
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
                gap: "12px",
                flex: "1 1 0",
                minWidth: 0,
                border: hovered
                    ? "2px solid #7c3aed"
                    : "2px solid var(--contact-card-border)",
                borderRadius: "16px",
                width: "100%",
                padding: "12px 14px",
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
            <div style={{ minWidth: 0 }}>
                <p
                    style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#7c3aed",
                        margin: 0,
                        lineHeight: 1.3,
                        wordBreak: "break-all",
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

function FloatingInput({
    id,
    name,
    placeholder,
    type = "text",
    value,
    onChange,
    autoComplete,
    disabled = false,
    maxLength,
}) {
    const [focused, setFocused] = useState(false);
    const active = focused || value.length > 0;

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete={autoComplete}
                disabled={disabled}
                maxLength={maxLength}
                style={{
                    width: "100%",
                    border: focused ? "1.5px solid #7c3aed" : "1.5px solid var(--contact-card-border)",
                    borderRadius: "10px",
                    padding: "14px 14px 6px",
                    fontSize: "0.875rem",
                    color: "var(--contact-text)",
                    background: "var(--contact-panel-bg)",
                    outline: "none",
                    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                    boxSizing: "border-box",
                    boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
                    opacity: disabled ? 0.72 : 1,
                }}
            />
            <label
                htmlFor={id}
                style={{
                    position: "absolute",
                    left: "14px",
                    top: active ? "5px" : "50%",
                    transform: active ? "translateY(0)" : "translateY(-50%)",
                    fontSize: active ? "0.65rem" : "0.85rem",
                    color: focused ? "#7c3aed" : "var(--contact-muted)",
                    fontWeight: active ? 500 : 400,
                    pointerEvents: "none",
                    transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                {placeholder}
            </label>
        </div>
    );
}

function FloatingTextarea({
    id,
    name,
    placeholder,
    value,
    onChange,
    disabled = false,
    maxLength,
}) {
    const [focused, setFocused] = useState(false);
    const active = focused || value.length > 0;

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <textarea
                id={id}
                name={name}
                rows={5}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                disabled={disabled}
                maxLength={maxLength}
                style={{
                    width: "100%",
                    border: focused ? "1.5px solid #7c3aed" : "1.5px solid var(--contact-card-border)",
                    borderRadius: "10px",
                    padding: "22px 14px 8px",
                    fontSize: "0.875rem",
                    color: "var(--contact-text)",
                    background: "var(--contact-panel-bg)",
                    outline: "none",
                    resize: "none",
                    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                    boxSizing: "border-box",
                    boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.1)" : "none",
                    fontFamily: "inherit",
                    opacity: disabled ? 0.72 : 1,
                }}
            />
            <label
                htmlFor={id}
                style={{
                    position: "absolute",
                    left: "14px",
                    top: active ? "6px" : "14px",
                    fontSize: active ? "0.65rem" : "0.85rem",
                    color: focused ? "#7c3aed" : "var(--contact-muted)",
                    fontWeight: active ? 500 : 400,
                    pointerEvents: "none",
                    transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                {placeholder}
            </label>
        </div>
    );
}

function getContactValidationMessage(values, validationCopy) {
    const nome = values.nome.trim();
    const email = values.email.trim();
    const assunto = values.assunto.trim();
    const mensagem = values.mensagem.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (nome.length < 2 || nome.length > 80) {
        return validationCopy.name;
    }

    if (!emailRegex.test(email) || email.length > 120) {
        return validationCopy.email;
    }

    if (assunto.length < 3 || assunto.length > 120) {
        return validationCopy.subject;
    }

    if (mensagem.length < 10 || mensagem.length > 2000) {
        return validationCopy.message;
    }

    return "";
}

export default function ContatoPage() {
    const { copy } = useLandingLanguage();
    const contact = copy.contact;
    const { resolvedTheme } = useTheme();
    const [openFaq, setOpenFaq] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [form, setForm] = useState(INITIAL_CONTACT_FORM);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState({ type: CONTACT_STATUS.idle, message: "" });

    useEffect(() => {
        setMounted(true);
    }, []);

    const colors =
        mounted && resolvedTheme === "dark" ? themeColors.dark : themeColors.light;
    const isDark = mounted && resolvedTheme === "dark";

    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));

        if (status.type === CONTACT_STATUS.error) {
            setStatus({ type: CONTACT_STATUS.idle, message: "" });
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (sending) {
            return;
        }

        const validationMessage = getContactValidationMessage(form, contact.validation);

        if (validationMessage) {
            setStatus({ type: CONTACT_STATUS.error, message: validationMessage });
            return;
        }

        setSending(true);
        setStatus({ type: CONTACT_STATUS.idle, message: "" });

        try {
            await sendContactMessage(form);
            setForm(INITIAL_CONTACT_FORM);
            setStatus({
                type: CONTACT_STATUS.success,
                message: contact.successMessage,
            });
        } catch (error) {
            setStatus({
                type: CONTACT_STATUS.error,
                message: error instanceof Error ? error.message : contact.errorMessage,
            });
        } finally {
            setSending(false);
        }
    }

    return (
        <div
            className="px-4 sm:px-6 md:px-8 lg:px-10"
            style={{
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
                paddingTop: "60px",
                paddingBottom: "60px",

                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                transition: "background-color 0.25s ease",
            }}
        >
            <div
                className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 xl:grid-cols-2"
                style={{ alignItems: "center" }}
            >
                {/* ESQUERDA — FAQ */}
                <div
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
                    <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-9 sm:pb-7">
                        <img
                            style={{ width: "70px", height: "70px" }}
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

                    <div className="px-5 pt-6 pb-8 sm:px-8 sm:pt-7 sm:pb-9">
                        <h2
                            style={{
                                fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
                                fontWeight: 300,
                                color: "#7c3aed",
                                margin: "0 0 20px",
                            }}
                        >
                            {contact.faqTitle}
                        </h2>

                        <div>
                            {contact.faqs.map((faq, i) => (
                                <FaqItem
                                    key={i}
                                    faq={faq}
                                    index={i}
                                    open={openFaq === i}
                                    onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                                />
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-4 pt-8 sm:gap-6 lg:gap-8">
                            <ContactCard
                                href="https://wa.me/5511900000000"
                                icon={<WhatsAppIcon isDark={isDark} />}
                                label={contact.cards.whatsapp}
                                value="+55 11 9000-0000"
                                delay={0}
                            />
                            <ContactCard
                                href="mailto:suporte.orbis@gmail.com"
                                icon={<EmailIcon isDark={isDark} />}
                                label={contact.cards.email}
                                value="suporte.orbis@gmail.com"
                                delay={160}
                            />
                        </div>
                    </div>
                </div>

                {/* DIREITA — Formulário */}
                <div className="flex flex-col w-full xl:ms-4 xl:mt-15 p-5">
                    <h2
                        style={{
                            fontSize: "1.8rem",
                            fontWeight: 300,
                            color: "#7c3aed",
                            margin: "0 0 8px",
                        }}
                    >
                        {contact.formTitle}
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "var(--contact-muted)", margin: "0 0 28px" }}>
                        {contact.formDescription}
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                    >
                        {/* Nome */}
                        <FloatingInput
                            id="contact-name"
                            name="nome"
                            placeholder={contact.fields.name}
                            value={form.nome}
                            onChange={(value) => updateField("nome", value)}
                            autoComplete="name"
                            disabled={sending}
                            maxLength={80}
                        />

                        {/* Email */}
                        <FloatingInput
                            id="contact-email"
                            name="email"
                            placeholder={contact.fields.email}
                            type="email"
                            value={form.email}
                            onChange={(value) => updateField("email", value)}
                            autoComplete="email"
                            disabled={sending}
                            maxLength={120}
                        />

                        {/* Assunto */}
                        <FloatingInput
                            id="contact-subject"
                            name="assunto"
                            placeholder={contact.fields.subject}
                            value={form.assunto}
                            onChange={(value) => updateField("assunto", value)}
                            autoComplete="off"
                            disabled={sending}
                            maxLength={120}
                        />

                        {/* Mensagem */}
                        <FloatingTextarea
                            id="contact-message"
                            name="mensagem"
                            placeholder={contact.fields.message}
                            value={form.mensagem}
                            onChange={(value) => updateField("mensagem", value)}
                            disabled={sending}
                            maxLength={2000}
                        />

                        {status.message ? (
                            <p
                                role={status.type === CONTACT_STATUS.error ? "alert" : "status"}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    margin: 0,
                                    color: status.type === CONTACT_STATUS.success ? "#16a34a" : "#dc2626",
                                    fontSize: "0.82rem",
                                    lineHeight: 1.45,
                                }}
                            >
                                {status.type === CONTACT_STATUS.success ? (
                                    <CheckCircle2Icon size={16} />
                                ) : (
                                    <AlertCircleIcon size={16} />
                                )}
                                {status.message}
                            </p>
                        ) : null}

                        {/* Botão */}
                        <div className="flex justify-center xl:justify-end">
                            <button
                                type="submit"
                                disabled={sending}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    marginTop: "4px",
                                    padding: "13px 24px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: "#7c3aed",
                                    color: "#fff",
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    cursor: sending ? "wait" : "pointer",
                                    transition: "opacity 0.2s ease, transform 0.2s ease",
                                    letterSpacing: "0.02em",
                                    opacity: sending ? 0.7 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (sending) return;
                                    e.currentTarget.style.opacity = "0.85";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    if (sending) return;
                                    e.currentTarget.style.opacity = "1";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                {sending ? (
                                    <Loader2Icon className="animate-spin" size={16} />
                                ) : (
                                    <SendIcon size={16} />
                                )}
                                {sending ? contact.sending : contact.submit}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
