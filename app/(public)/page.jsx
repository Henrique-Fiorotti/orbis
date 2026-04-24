import Link from "next/link";

import HeroDashboard from "@/components/hero-dashboard";
import LazySplineFrame from "@/components/landing/lazy-spline-frame";
import RevealOnScroll from "@/components/landing/reveal-on-scroll";
import ScrollViewportButton from "@/components/landing/scroll-viewport-button";
import Pricing from "@/components/pricing";
import { Separator } from "@/components/ui/separator";
import SobreInformativo from "@/components/sobre-informativo";

import styles from "./page.module.css";

const FEATURES = [
  {
    icon: "/visibility.svg",
    title: "Monitoramento em tempo real",
    desc: "Acompanhe cada operação da sua empresa com dashboards precisos e alertas instantâneos.",
    delay: 0,
  },
  {
    icon: "/bolt.svg",
    title: "Previsão de falhas",
    desc: "Algoritmos preditivos identificam riscos antes que se tornem problemas reais.",
    delay: 80,
  },
  {
    icon: "/shield.svg",
    title: "Segurança avançada",
    desc: "Criptografia de ponta a ponta e controle de acesso granular para cada usuário.",
    delay: 160,
  },
  {
    icon: "/analytics.svg",
    title: "Relatórios inteligentes",
    desc: "Relatórios automáticos com insights acionáveis para decisões mais rápidas e assertivas.",
    delay: 240,
  },
];

const STEPS = [
  {
    n: "1",
    title: "Registre sua empresa",
    desc: "Crie sua conta em minutos e configure o perfil da sua organização.",
    delay: 0,
  },
  {
    n: "2",
    title: "Conecte suas operações",
    desc: "Integre sistemas existentes ou utilize nossa plataforma nativa para monitoramento.",
    delay: 100,
  },
  {
    n: "3",
    title: "Monitore e preveja",
    desc: "Receba alertas inteligentes e veja tendências antes de virarem crises.",
    delay: 200,
  },
  {
    n: "4",
    title: "Aja com confiança",
    desc: "Tome decisões respaldadas por dados reais e previsões precisas.",
    delay: 300,
  },
];

const DEFERRED_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "720px",
};

const HERO_DASHBOARD_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "760px",
};

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <RevealOnScroll delay={delay} style={{ flex: "1 1 220px" }}>
      <div className={styles.featureCard}>
        <img
          src={icon}
          alt={title}
          className={styles.featureIcon}
          loading="lazy"
          decoding="async"
        />
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "var(--landing-heading)",
            margin: "0 0 8px",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--landing-muted)",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {desc}
        </p>
      </div>
    </RevealOnScroll>
  );
}

function Step({ n, title, desc, delay }) {
  return (
    <RevealOnScroll delay={delay} offsetX={-32}>
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
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
              color: "var(--landing-heading)",
              margin: "0 0 4px",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--landing-muted)",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {desc}
          </p>
        </div>
      </div>
    </RevealOnScroll>
  );
}

export default function HomePage() {
  return (
    <div className={styles.root}>
      <section
        id="inicio"
        style={{
          minHeight: "85vh",
          display: "flex",
          flexDirection: "row-reverse",
          justifyContent: "center",
          padding: "180px 15% 100px 15%",
          position: "relative",
          background: "var(--landing-section-bg)",
          objectFit: "cover",
          marginTop: "70px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(circle, var(--landing-grid-dot) 1px, transparent 1px)",
            backgroundSize: "53px 36px",
            opacity: 0.35,
          }}
        />

        <LazySplineFrame
          src="https://my.spline.design/pixeltextsetcopycopy-FVOpkQ2LEECtjtmYxOWm4Dq9-V1Z/"
          title="Demonstração 3D da Orbis"
          className={styles.heroSpline}
          frameClassName={styles.heroSplineFrame}
          overlayClassName={styles.heroSplineMask}
        />

          {/* Essa parte vai até o registrar empresa */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
          <h1
            className={styles.heroTitle}
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(2.8rem, 6vw, 3.6rem)",
              fontWeight: 200,
              lineHeight: 1.05,
              letterSpacing: "-2px",
              marginBottom: "28px",
              color: "var(--landing-heading)",
            }}
          >
            Antecipando <span style={{ color: "#7c3aed" }}>falhas</span>,<br />
            realizando operações <span style={{ color: "#7c3aed" }}>seguras</span>.
          </h1>

          <p
            className={styles.heroSubtitle}
            style={{
              fontSize: "1.4rem",
              color: "var(--landing-muted)",
              lineHeight: 1.3,
              fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
              maxWidth: "420px",
              marginBottom: "36px",
            }}
          >
            Inteligência operacional para empresas que não podem errar.
          </p>

          <div
            className={styles.heroActions}
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            <Link href="/login" prefetch={false} className={styles.primaryCta}>
              Acesse o Orbis
            </Link>
            <Link href="#sobre" className={styles.secondaryCta}>
              Sobre
            </Link>
          </div>

          <div className={styles.heroRegister}>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--landing-subtle)",
                marginBottom: "4px",
              }}
            >
              Não tem uma conta?
            </p>
            <Link href="/registro" prefetch={false} className={styles.registerLink}>
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
                aria-hidden="true"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "36px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
          }}
        >
          <div className={styles.heroScroll}>
            <ScrollViewportButton
              buttonClassName={styles.scrollButton}
              ringClassName={styles.scrollButtonRing}
              iconClassName={styles.scrollButtonIcon}
            />
          </div>
        </div>
      </section>

      <section // Essa parte é o confie no processo lá
        style={{
          height: "30dvh",
          background: "var(--landing-quote-bg)",
          padding: "28px 8vw",
          marginTop: "70px",
          ...DEFERRED_SECTION_STYLE,
        }}
      >
        <RevealOnScroll
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
                color: "var(--landing-heading)",
                marginBottom: "16px",
              }}
            >
              "Prever <span style={{ color: "#7c3aed" }}>erros</span> hoje é evitar
              prejuízos <span style={{ color: "#7c3aed" }}>amanhã</span>"
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--landing-muted)",
                lineHeight: 1.6,
                textAlign: "start",
              }}
            >
              Confie no processo.
              <br />
              <strong style={{ color: "var(--landing-heading)" }}>Junte-se à Orbis</strong>
            </p>
          </div>
          <img
            className="h-full"
            src="/banner_hero.svg"
            alt=""
            width="545"
            height="367"
            loading="lazy"
            decoding="async"
          />
        </RevealOnScroll>
      </section>

  {/* aqui é onde deve ter o real sobre */}
    <section id="sobre" style={{
          background: "var(--landing-alt-bg)",
          transition: "background-color 0.25s ease"}}> 
     <SobreInformativo />
    </section>
    
      <section style={{ padding: "96px 8vw", ...DEFERRED_SECTION_STYLE }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "var(--landing-accent-label)",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            O que oferecemos
          </p>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              color: "var(--landing-heading)",
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
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          background: "var(--landing-alt-bg)",
          transition: "background-color 0.25s ease",
          ...HERO_DASHBOARD_STYLE,
        }}
      >
        <HeroDashboard />
      </section>

      <section
        style={{
          padding: "96px 8vw",
          background: "var(--landing-section-bg)",
          ...DEFERRED_SECTION_STYLE,
        }}
      >
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
                color: "var(--landing-accent-label)",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Como funciona
            </p>
            <h2
              style={{
                fontFamily: "'Poppins', sans-serif",
                color: "var(--landing-heading)",
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
                color: "var(--landing-accent-strong)",
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
            {STEPS.map((step) => (
              <Step key={step.n} {...step} />
            ))}
          </div>
        </div>
      </section>

      <Separator orientation="horizontal" />

      <div id="planos" style={DEFERRED_SECTION_STYLE}>
        <Pricing />
      </div>

      <section
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          padding: "40px 8vw",
          textAlign: "center",
          ...DEFERRED_SECTION_STYLE,
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
          <Link href="/contact" prefetch={false} className={styles.finalCta}>
            Fale conosco
          </Link>
        </div>
      </section>
    </div>
  );
}
