"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import HeroDashboard from "@/components/hero-dashboard";
import { getValidAuthSession, isAuthSessionRemembered } from "@/lib/auth-session";
import { useLandingLanguage } from "@/components/landing/language-provider";
import HorizontalFinalQuote from "@/components/landing/horizontal-final-quote";
import RevealOnScroll from "@/components/landing/reveal-on-scroll";
import ScrollViewportButton from "@/components/landing/scroll-viewport-button";
import Pricing from "@/components/pricing";
import { Separator } from "@/components/ui/separator";
import SobreInformativo from "@/components/sobre-informativo";
import SAQ from "@/components/saq";
import SlideOpacity from "@/components/carousel-10";
import CreativeTeamSection from "@/components/creative-team-section";

import styles from "./page.module.css";
import Image from "next/image";

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
  const { copy, locale } = useLandingLanguage();
  const { home } = copy;
  const router = useRouter();
  const heroSectionRef = React.useRef(null);

  React.useEffect(() => {
    if (isAuthSessionRemembered() && getValidAuthSession()) {
      router.replace("/dashboard");
      return;
    }

    const url = new URL(window.location.href);

    if (url.searchParams.get("login") !== "1") {
      return;
    }

    url.searchParams.delete("login");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    router.push("/login", { scroll: false });
  }, [router]);

  function handleHeroPointerMove(event) {
    const section = heroSectionRef.current;

    if (!section) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    section.style.setProperty("--hero-sparkle-shift-x", `${x * 7}px`);
    section.style.setProperty("--hero-sparkle-shift-y", `${y * 6}px`);
  }

  function resetHeroPointer() {
    const section = heroSectionRef.current;

    if (!section) {
      return;
    }

    section.style.setProperty("--hero-sparkle-shift-x", "0px");
    section.style.setProperty("--hero-sparkle-shift-y", "0px");
  }

  return (

    <div className={styles.root}>

      <section
        ref={heroSectionRef}
        id="inicio"
        className={styles.heroSection}
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={resetHeroPointer}
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
            zIndex: 0,
            opacity: "var(--landing-grid-opacity)",
          }}
        />

        <div className={styles.heroVisual}>
          <Image
            src="/orbis-spline-heroo.svg"
            alt={home.hero.splineTitle}
            className={styles.heroImage}
            width={450}
            height={450}
            priority
          />
        </div>

        <div className={styles.heroContent}>
          <h1
            className={styles.heroTitle}
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "var(--hero-title-size)",
              fontWeight: 200,
              lineHeight: "var(--hero-title-line-height)",
              letterSpacing: "var(--hero-title-letter-spacing)",
              marginBottom: "var(--hero-title-margin)",
              color: "var(--landing-heading)",
            }}
          >
            {home.hero.titleLines.map((line, index) => (
              <span key={`${line.highlight}-${index}`}>
                {line.before}
                <span style={{ color: "#7c3aed" }}>{line.highlight}</span>
                {line.after}
                {index < home.hero.titleLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>

          <p
            className={styles.heroSubtitle}
            style={{
              fontSize: "var(--hero-subtitle-size)",
              color: "var(--landing-muted)",
              lineHeight: "var(--hero-subtitle-line-height)",
              fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
              maxWidth: "min(420px, 100%)",
              marginBottom: "var(--hero-subtitle-margin)",
            }}
          >
            {home.hero.subtitle}
          </p>

          <div
            className={styles.heroActions}
            style={{
              display: "flex",
              gap: "var(--hero-actions-gap)",
              flexWrap: "wrap",
              marginBottom: "var(--hero-actions-margin)",
            }}
          >
            <Link href="/login" prefetch={false} scroll={false} className={styles.primaryCta}>
              {home.hero.primaryCta}
            </Link>
            <Link href="#sobre" className={styles.secondaryCta}>
              {home.hero.secondaryCta}
            </Link>
          </div>

          <div className={styles.heroRegister}>
            <p
              style={{
                fontSize: "var(--hero-register-size)",
                color: "var(--landing-subtle)",
              }}
            >
              {home.hero.registerQuestion}
            </p>
            <Link
              href="/#planos"
              prefetch={false}
              className={styles.registerLink}
              style={{ fontSize: "var(--hero-register-size)" }}
            >
              {home.hero.registerCta}
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

        <div className={styles.heroScrollAnchor}>
          <div className={styles.heroScroll}>
            <ScrollViewportButton
              ariaLabel={home.hero.scrollDownLabel}
              buttonClassName={styles.scrollButton}
              ringClassName={styles.scrollButtonRing}
              iconClassName={styles.scrollButtonIcon}
            />
          </div>
        </div>
      </section>

      <HorizontalFinalQuote key={`final-quote-${locale}`} quote={home.quote} />

      {/* SrOrbis */}
      <section id="sobre" className={styles.srOrbisSection}>
        <RevealOnScroll>
          <SobreInformativo />
        </RevealOnScroll>
      </section>

      {/* Carrossel  */}

      <section className={styles.benefitsSection}>
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
            {home.benefits.eyebrow}
          </p>
          <RevealOnScroll>
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
              {home.benefits.title}
            </h2>

            <SlideOpacity items={home.features} />
          </RevealOnScroll>
        </div>
      </section >


      {/* Mostando o Dashboard */}
      < section
        style={{
          background: "var(--landing-alt-bg)",
          transition: "background-color 0.25s ease",
          borderTop: "#7b39ed57 1px solid",
        }
        }
      >
        <RevealOnScroll>
          <HeroDashboard />
        </RevealOnScroll>
      </section >

      {/* Como Funciona */}
      < section
        className={`${styles.processSection} ${styles.gridBackgroundSection}`}
      >
        <div className={styles.processInner}>
          <div className={styles.processIntro}>
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
              {home.process.eyebrow}
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
              {home.process.titleLine1}
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
              {home.process.titleLine2}
            </h2>
          </div>
          <div className={styles.stepsList}>
            {home.steps.map((step) => (
              <Step key={step.n} {...step} />
            ))}
          </div>
        </div>
      </section >

      {/* Planos */}
      <div id="planos" className={styles.gridBackgroundSection}>
        <RevealOnScroll>
          <Pricing />
        </RevealOnScroll>
      </div>

      {/* SAQ */}
      <section id="contact" className={styles.gridBackgroundSection}>
        <SAQ />
      </section>

      <section className={styles.gridBackgroundSection}>
        <RevealOnScroll>
          <CreativeTeamSection />
        </RevealOnScroll>
      </section>

    </div >

  );
}
