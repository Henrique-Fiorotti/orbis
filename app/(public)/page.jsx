"use client";

import LogoCloud from "@/components/logo-cloud";
import Pricing from "@/components/pricing";
import { ChartPieDonut } from "@/components/ui/chart-pie-donut";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";

/* ── tiny hook: fade-in on scroll ── */
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── animated counter ── */
function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useFadeIn();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      start += step;
      if (start >= to) {
        setVal(to);
        clearInterval(id);
      } else setVal(start);
    }, 18);
    return () => clearInterval(id);
  }, [visible, to]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── feature card ── */
function FeatureCard({ icon, title, desc, delay }) {
  const [hovered, setHovered] = useState(false);
  const [ref, visible] = useFadeIn();
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 220px",
        background: hovered ? "white" : "white",
        border: `1.5px solid ${hovered ? "#7c3aed" : "#ede9fe"}`,
        borderRadius: "8px",
        padding: "28px 24px",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform: visible,
        opacity: visible ? 1 : 0,
        transitionDelay: `${delay}ms`,
        boxShadow: hovered
          ? "0 16px 48px rgba(124,58,237,0.12)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        cursor: "default",
      }}
    >
      <img
        src={icon}
        alt={title}
        style={{ width: "1.8rem", height: "1.8rem", marginBottom: "14px" }}
      />
      <p
        style={{
          fontWeight: 700,
          fontSize: "0.95rem",
          color: "#111",
          margin: "0 0 8px",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: "0.82rem",
          color: "#6b7280",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

/* ── step item ── */
function Step({ n, title, desc, delay }) {
  const [ref, visible] = useFadeIn();
  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-32px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#7c3aed,#9333ea)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {n}
      </div>
      <div>
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "#111",
            margin: "0 0 4px",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "0.82rem",
            color: "#6b7280",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const scrollDown = () => {
    window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
  };

  const [quoteRef, quoteVisible] = useFadeIn();
  const [statsRef, statsVisible] = useFadeIn();

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#fff",
        color: "#111",
        overflowX: "hidden",
      }}
    >
      <style>{`
        
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar-thumb { background: #7C3AED; border-radius: 1px; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* ══ HERO ══ */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "row-reverse",
          justifyContent: "center",
          padding: "180px 15% 100px 15%",
          position: "relative",
          background: "#fff",
          objectFit: "cover",
        }}
      >
        {/* subtle dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(circle, #e9d5ff 1px, transparent 1px)",
            backgroundSize: "53px 36px",
            opacity: 0.35,
          }}
        />

        {/* glow blob */}
        <div
          style={{
            position: "relative",
            width: "540px",
            height: "440px",
            borderRadius: "10%",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <script
            type="module"
            src="https://cdn.spline.design/@splinetool/hana-viewer@1.2.51/hana-viewer.js"
          ></script>
         <iframe src="https://my.spline.design/pixeltextsetcopycopy-FVOpkQ2LEECtjtmYxOWm4Dq9-V1Z/" frameBorder="0" width="100%" height="100%"></iframe>
         <div className="absolute! bg-white! h-15 w-45 right-0! bottom-0!"></div>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(2.8rem, 6vw, 3.6rem)",
              fontWeight: 200,
              lineHeight: 1.05,
              letterSpacing: "-2px",
              marginBottom: "28px",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "none" : "translateY(20px)",
              transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
              color: "#212121",
            }}
          >
            Antecipando <span style={{ color: "#7c3aed" }}>falhas</span>,<br />
            realizando operações{" "}
            <span style={{ color: "#7c3aed" }}>seguras</span>.
          </h1>

          <p
            style={{
              fontSize: "1.4rem",
              color: "#6b7280",
              lineHeight: 1.3,
              fontFamily: "'Open-sans', 'Segoe UI', sans-serif",
              maxWidth: "420px",
              marginBottom: "36px",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "none" : "translateY(16px)",
              transition: "opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s",
            }}
          >
            Inteligência operacional para empresas que não podem errar.
          </p>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "28px",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "none" : "translateY(14px)",
              transition: "opacity 0.6s ease 0.45s, transform 0.6s ease 0.45s",
            }}
          >
            <a
              href="/login"
              style={{
                background: "#7b39ed",
                color: "#fff",
                padding: "13px 28px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.9rem",
                fontFamily: "'Poppins', sans-serif",
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition:
                  "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background-color 0.2s ease",
                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.color = "#7b39ed";
                e.currentTarget.style.border = " 2px solid #7b39ed";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.backgroundColor = "#7b39ed";
                e.currentTarget.style.border = " 2px solid transparent";
              }}
            >
              Acesse o Orbis
            </a>
            <a
              href="#sobre"
              style={{
                background: "transparent",
                color: "#111",
                padding: "13px 28px",
                borderRadius: "10px",
                fontWeight: 500,
                fontSize: "0.9rem",
                fontFamily: "'Poppins', sans-serif",
                textDecoration: "none",
                letterSpacing: "0.01em",
                border: "2px solid #e5e7eb",
                transition: "border-color 0.2s ease, color 0.2s ease",
                display: "inline-block",
                color: "#212121",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#7c3aed";
                e.currentTarget.style.color = "#7c3aed";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#212121";
              }}
            >
              Sobre
            </a>
          </div>

          {/* Register link */}
          
          <div
            style={{
              opacity: heroVisible ? 1 : 0,
              transition: "opacity 0.6s ease 0.55s",
            }}
          >
            <p
              style={{
                fontSize: "0.82rem",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              Não tem uma conta?
            </p>
            <a
              href="/registro"
              style={{
                fontSize: "0.85rem",
                color: "#7c3aed",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              Registrar empresa
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>
        </div>

        {/* scroll down */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            opacity: heroVisible ? 1 : 0,
            transition: "opacity 0.6s ease 0.8s",
          }}
        >
          <button
            onClick={scrollDown}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#212121",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              animation: "float 2.4s ease-in-out infinite",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid rgba(0,0,0,0.25)",
                animation: "pulse-ring 2s ease-out infinite",
              }}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M12 16l-6-6h12z" />
            </svg>
          </button>
        </div>
      </section>

      {/* ══ QUOTE ══ */}
      <section
        style={{
          height: "30dvh",
          background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
          padding: "28px 8vw",
          marginTop: "70px",
        }}
      >
        <div
          ref={quoteRef}
          style={{
            display: "flex",
            maxWidth: "100%",
            height: "100%",
            margin: "0",
            paddingLeft: "15%",
            paddingRight: "15%",
            justifyContent: "space-between",
            alignContent: "space-between",
            alignItems: "center",
            textAlign: "center",
            opacity: quoteVisible ? 1 : 0,
            transform: quoteVisible ? "none" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <div className="w-3/5 h-auto">
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                fontWeight: 100,
                lineHeight: 1.3,
                letterSpacing: "-0.5px",
                textAlign: "start",
                color: "#212121",
                marginBottom: "16px",
              }}
            >
              "Prever <span style={{ color: "#7c3aed" }}>erros</span> hoje é
              evitar prejuízos <span style={{ color: "#7c3aed" }}>amanhã</span>"
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "#6b7280",
                lineHeight: 1.6,
                textAlign: "start",
              }}
            >
              Confie no processo.
              <br />
              <strong style={{ color: "#212121" }}>Junte-se à Orbis</strong>
            </p>
          </div>
          <img className="h-full" src="/banner_hero.svg" alt="" />
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="sobre" style={{ padding: "96px 8vw" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#7c3aed",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            O que oferecemos
          </p>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              color: "#212121",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 200,
              letterSpacing: "-1px",
              marginBottom: "48px",
              maxWidth: "480px",
              lineHeight: 1.15,
            }}
          >
            Tecnologia que trabalha enquanto você lidera.
          </h2>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            <FeatureCard
              icon="/visibility.svg"
              title="Monitoramento em tempo real"
              desc="Acompanhe cada operação da sua empresa com dashboards precisos e alertas instantâneos."
              delay={0}
            />
            <FeatureCard
              icon="/bolt.svg"
              title="Previsão de falhas"
              desc="Algoritmos preditivos identificam riscos antes que se tornem problemas reais."
              delay={80}
            />
            <FeatureCard
              icon="/shield.svg"
              title="Segurança avançada"
              desc="Criptografia de ponta a ponta e controle de acesso granular para cada usuário."
              delay={160}
            />
            <FeatureCard
              icon="/analytics.svg"
              title="Relatórios inteligentes"
              desc="Relatórios automáticos com insights acionáveis para decisões mais rápidas e assertivas."
              delay={240}
            />
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ background: "#111", padding: "80px 8vw" }}>
        <div
          ref={statsRef}
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "40px",
            textAlign: "center",
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? "none" : "translateY(20px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 100,
          }}
        >
          {[
            { to: 98, suffix: "%", label: "Uptime garantido" },
            { to: 1200, suffix: "+", label: "Empresas ativas" },
            { to: 4700, suffix: "+", label: "Falhas prevenidas" },
            { to: 24, suffix: "/7", label: "Suporte disponível" },
          ].map((s) => (
            <div key={s.label}>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: "clamp(2.2rem, 4vw, 3rem)",
                  fontWeight: 500,
                  color: "#fff",
                  margin: "0 0 6px",
                }}
              >
                <Counter to={s.to} suffix={s.suffix} />
              </p>
              <p style={{ fontSize: "0.82rem", color: "#9ca3af" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ padding: "96px 8vw", background: "#fff" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            gap: "64px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 320px" }}>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#7c3aed",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Como funciona
            </p>
            <h2
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: "#212121",
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 200,
                letterSpacing: "-1px",
                lineHeight: 0.7,
                marginBottom: "8px",
              }}
            >
              Simples de começar.
            </h2>
            <h2
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 500,
                letterSpacing: "-1px",
                lineHeight: 1.15,
                color: "#7c3aed",
              }}
            >
              Poderoso no uso.
            </h2>
          </div>
          <div
            style={{
              flex: "1 1 320px",
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            <Step
              n="1"
              title="Registre sua empresa"
              desc="Crie sua conta em minutos e configure o perfil da sua organização."
              delay={0}
            />
            <Step
              n="2"
              title="Conecte suas operações"
              desc="Integre sistemas existentes ou utilize nossa plataforma nativa para monitoramento."
              delay={100}
            />
            <Step
              n="3"
              title="Monitore e preveja"
              desc="Receba alertas inteligentes e veja tendências antes de virarem crises."
              delay={200}
            />
            <Step
              n="4"
              title="Aja com confiança"
              desc="Tome decisões respaldadas por dados reais e previsões precisas."
              delay={300}
            />
          </div>
        </div>
      </section>

      <Separator orientation="horizontal" />

      <Pricing />

      {/* ══ CTA FINAL ══ */}
      <section
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          padding: "40px 8vw",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 200,
            color: "#fff",
            letterSpacing: "-1px",
            marginBottom: "16px",
          }}
        >
          Pronto para operar com segurança?
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "0.95rem",
            marginBottom: "36px",
            lineHeight: 1.6,
          }}
        >
          Junte-se a centenas de empresas que já confiam no Orbis.
        </p>
        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/contact"
            style={{
              background: "transparent",
              color: "#fff",
              padding: "14px 32px",
              borderRadius: "10px",
              fontWeight: 500,
              fontSize: "0.9rem",
              textDecoration: "none",
              border: "2px solid rgba(255,255,255,0.4)",
              transition: "border-color 0.2s ease",
              display: "inline-block",
              fontFamily: "'Poppins', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
            }}
          >
            Fale conosco
          </a>
        </div>
      </section>

      
    </div>
  );
}
