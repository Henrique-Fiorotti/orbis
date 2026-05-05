"use client";

import Link from "next/link";

import HeroDashboard from "@/components/hero-dashboard";
import { useLandingLanguage } from "@/components/landing/language-provider";
import LazySplineFrame from "@/components/landing/lazy-spline-frame";
import RevealOnScroll from "@/components/landing/reveal-on-scroll";
import ScrollViewportButton from "@/components/landing/scroll-viewport-button";
import Pricing from "@/components/pricing";
import { Separator } from "@/components/ui/separator";
import SobreInformativo from "@/components/sobre-informativo";
import SAQ from "@/components/saq";

import styles from "./page.module.css";

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
  const { copy } = useLandingLanguage();
  const { home } = copy;

  return (
    <div className={styles.root}>
      <section
        id="inicio"
        className={styles.heroSection}
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
          title={home.hero.splineTitle}
          className={styles.heroSpline}
          id="hero-spline"
          frameClassName={styles.heroSplineFrame}
          overlayClassName={styles.heroSplineMask}
        />

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
              fontSize: "1.4rem",
              color: "var(--landing-muted)",
              lineHeight: 1.3,
              fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
              maxWidth: "420px",
              marginBottom: "36px",
            }}
          >
            {home.hero.subtitle}
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
              {home.hero.primaryCta}
            </Link>
            <Link href="#sobre" className={styles.secondaryCta}>
              {home.hero.secondaryCta}
            </Link>
          </div>

          <div className={styles.heroRegister}>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--landing-subtle)",
              }}
            >
              {home.hero.registerQuestion}
            </p>
            <Link
              href="/registro"
              prefetch={false}
              className={styles.registerLink}
              style={{ fontSize: "1rem" }}
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
              ariaLabel={home.hero.scrollDownLabel}
              buttonClassName={styles.scrollButton}
              ringClassName={styles.scrollButtonRing}
              iconClassName={styles.scrollButtonIcon}
            />
          </div>
        </div>
      </section>

      <section
        className={styles.quoteSection}
        style={DEFERRED_SECTION_STYLE}
      >
        <RevealOnScroll className={styles.quoteContent}>
          <div className={styles.quoteText}>
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
              {home.quote.before}
              <span style={{ color: "#7c3aed" }}>{home.quote.highlight}</span>
              {home.quote.middle}
              <span style={{ color: "#7c3aed" }}>{home.quote.secondHighlight}</span>
              {home.quote.after}
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--landing-muted)",
                lineHeight: 1.6,
                textAlign: "start",
              }}
            >
              {home.quote.supportText}
              <br />
              <strong style={{ color: "var(--landing-heading)" }}>{home.quote.joinText}</strong>
            </p>
          </div>
          <img
            className={styles.quoteImage}
            src="/banner_hero.svg"
            alt=""
            width="545"
            height="367"
            loading="lazy"
            decoding="async"
          />
        </RevealOnScroll>
      </section>

      <section id="sobre" style={{
        background: "var(--landing-alt-bg)",
        transition: "background-color 0.25s ease",
        paddingTop:"45px"
      }}>
        <SobreInformativo />
      </section>
      <section className={styles.benefitsSection} style={DEFERRED_SECTION_STYLE}
      >
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
          <div className={styles.benefitsGrid}>
            {home.features.map((feature) => (
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
        className={styles.processSection}
        style={DEFERRED_SECTION_STYLE}
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
          {home.final.title}
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "0.95rem",
            marginBottom: "36px",
            lineHeight: 1.6,
          }}
        >
          {home.final.description}
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
            {home.final.cta}
          </Link>
        </div>
      </section>
      <section id="contact" >
        <SAQ/>
      </section>
    </div>
  );
}
