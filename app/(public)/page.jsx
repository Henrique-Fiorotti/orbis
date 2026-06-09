"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { gsap } from "gsap";

import AnimatedHeroKeyword from "@/components/landing/animated-hero-keyword";
import HeroDashboard from "@/components/hero-dashboard";
import HeroMorphVisual from "@/components/landing/hero-morph-visual";
import { getValidAuthSession, isAuthSessionRemembered } from "@/lib/auth-session";
import { useLandingLanguage } from "@/components/landing/language-provider";
import AnimatedQuote from "@/components/landing/animated-quote";
import LandingParallaxDoodles from "@/components/landing/parallax-doodles";
import RevealOnScroll from "@/components/landing/reveal-on-scroll";
import ScrollViewportButton from "@/components/landing/scroll-viewport-button";
import Pricing from "@/components/pricing";
import SobreInformativo from "@/components/sobre-informativo";
import SAQ from "@/components/saq";
import SlideOpacity from "@/components/carousel-10";
import CreativeTeamSection from "@/components/creative-team-section";

import styles from "./page.module.css";

const HERO_KEYWORD_VARIANTS = {
  pt: ["seguras", "automáticas", "precisas", "rápidas", "inteligentes"],
  en: ["safe", "automated", "precise", "fast", "intelligent"],
  es: ["seguras", "automáticas", "precisas", "rápidas", "inteligentes"],
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function HeroSecondaryCta({ href, className, children }) {
  const linkRef = React.useRef(null);
  const textRef = React.useRef(null);
  const iconLayerRef = React.useRef(null);
  const iconRef = React.useRef(null);
  const timelineRef = React.useRef(null);

  useIsomorphicLayoutEffect(() => {
    const link = linkRef.current;
    const text = textRef.current;
    const iconLayer = iconLayerRef.current;
    const icon = iconRef.current;

    if (!link || !text || !iconLayer || !icon) {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.set(text, { y: 0, autoAlpha: 1 });
      gsap.set(iconLayer, { yPercent: 115, autoAlpha: 1 });
      gsap.set(icon, { scale: 0.9, rotation: -10, autoAlpha: 0 });

      timelineRef.current = gsap.timeline({
        paused: true,
        defaults: { duration: 0.34, ease: "power3.inOut", overwrite: "auto" },
      })
        .to(text, { y: -48 }, 0)
        .to(iconLayer, { yPercent: 0 }, 0.02)
        .to(icon, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.22, ease: "power2.out" }, 0.14);
    }, link);

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      context.revert();
    };
  }, [children]);

  const playSplit = () => timelineRef.current?.play();
  const reverseSplit = () => timelineRef.current?.reverse();

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      onMouseEnter={playSplit}
      onMouseLeave={reverseSplit}
      onFocus={playSplit}
      onBlur={reverseSplit}
    >
      <span ref={textRef} className={styles.heroSplitText}>
        {children}
      </span>
      <span ref={iconLayerRef} className={styles.heroSplitIconLayer} aria-hidden="true">
        <SearchIcon ref={iconRef} size={18} strokeWidth={2.25} className={styles.heroSplitIcon} />
      </span>
    </Link>
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
  const { copy, locale } = useLandingLanguage();
  const { home } = copy;
  const router = useRouter();
  const heroSectionRef = React.useRef(null);
  const heroKeywordVariants = HERO_KEYWORD_VARIANTS[locale] ?? HERO_KEYWORD_VARIANTS.pt;
  const [heroKeywordIndex, setHeroKeywordIndex] = React.useState(0);
  const heroDynamicKeyword =
    heroKeywordVariants[heroKeywordIndex] ?? home.hero.titleLines[1]?.highlight ?? "";

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

  React.useEffect(() => {
    setHeroKeywordIndex(0);
  }, [locale]);

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
            opacity: "var(--landing-grid-opacity)",
          }}
        />

        <div className={styles.heroVisual}>
          <HeroMorphVisual ariaLabel={home.hero.splineTitle} onShapeChange={setHeroKeywordIndex} />
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
                {index === 1 ? (
                  <AnimatedHeroKeyword
                    word={heroDynamicKeyword}
                    className={styles.heroDynamicKeyword}
                    reserveWords={heroKeywordVariants}
                  />
                ) : (
                  <span style={{ color: "#7c3aed" }}>{line.highlight}</span>
                )}
                {index === 1 ? "" : line.after}
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
            <HeroSecondaryCta href="#sobre" className={styles.secondaryCta}>
              {home.hero.secondaryCta}
            </HeroSecondaryCta>
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

      <section className={styles.quoteSection}>
        <div className={styles.quoteContent}>
          <AnimatedQuote
            key={`${home.quote.before}-${home.quote.highlight}`}
            quote={home.quote}
            className={styles.quoteText}
          />
          <img
            className={styles.quoteImage}
            src="/banner_hero.svg"
            alt=""
            width="545"
            height="367"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

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
      </section>


      {/* Mostando o Dashboard */}
      <section
        className={`${styles.dashboardPreviewSection} ${styles.gridBackgroundSection} ${styles.parallaxDoodleSection}`}
      >
        <LandingParallaxDoodles variant="dashboard" />
        <RevealOnScroll>
          <HeroDashboard />
        </RevealOnScroll>
      </section>

      {/* Como Funciona */}
      <section
        className={`${styles.processSection} ${styles.gridBackgroundSection} ${styles.parallaxDoodleSection}`}
      >
        <LandingParallaxDoodles variant="process" />
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
      </section>

      {/* Planos */}
      <div id="planos" className={`${styles.gridBackgroundSection} ${styles.parallaxDoodleSection}`}>
        <LandingParallaxDoodles variant="pricing" />
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

    </div>

  );
}
