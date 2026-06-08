"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import {
  getFinalQuoteAuthor,
  getFinalQuoteText,
} from "@/lib/landing-final-quote.mjs";
import { LANDING_LANGUAGE_CHANGE_START_EVENT } from "@/components/landing/language-provider";
import { getHorizontalQuoteAnimationMetrics } from "@/lib/landing-horizontal-quote-animation.mjs";

import styles from "./horizontal-final-quote.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const REFRESH_DELAYS = [0, 120, 360, 900, 1500];
const LOADER_FALLBACK_DELAY = 3200;

function waitForDocumentFonts() {
  try {
    return document.fonts?.ready ?? Promise.resolve();
  } catch {
    return Promise.resolve();
  }
}

function waitForWindowLoad() {
  if (document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener("load", resolve, { once: true });
  });
}

function waitForLandingLoader() {
  if (window.__orbisLandingLoaderComplete === true) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId = 0;

    function complete() {
      window.clearTimeout(timeoutId);
      window.removeEventListener("orbis:landing-loader-complete", complete);
      resolve();
    }

    timeoutId = window.setTimeout(complete, LOADER_FALLBACK_DELAY);
    window.addEventListener("orbis:landing-loader-complete", complete, { once: true });
  });
}

export default function HorizontalFinalQuote({ quote }) {
  const sectionRef = React.useRef(null);
  const orbRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const quoteRef = React.useRef(null);

  const quoteText = React.useMemo(() => getFinalQuoteText(quote), [quote]);
  const authorText = React.useMemo(() => getFinalQuoteAuthor(quote), [quote]);

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const orb = orbRef.current;
    const track = trackRef.current;
    const quoteNode = quoteRef.current;

    if (!section || !orb || !track || !quoteNode) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotionQuery.matches) {
      gsap.set([track, quoteNode], {
        autoAlpha: 1,
        clearProps: "transform",
      });
      gsap.set(orb, { autoAlpha: 0 });
      return undefined;
    }

    let context = null;
    let split = null;
    let frameId = 0;
    let refreshFrameId = 0;
    let refreshTimeoutId = 0;
    let resizeObserver = null;
    const refreshTimeoutIds = [];
    let isDisposed = false;

    function getMetrics() {
      return getHorizontalQuoteAnimationMetrics({
        sectionWidth: section.clientWidth,
        trackWidth: track.scrollWidth,
      });
    }

    function scheduleRefresh() {
      if (isDisposed || refreshFrameId) {
        return;
      }

      refreshFrameId = window.requestAnimationFrame(() => {
        refreshFrameId = 0;

        if (!isDisposed) {
          ScrollTrigger.refresh();
        }
      });
    }

    function scheduleDebouncedRefresh() {
      window.clearTimeout(refreshTimeoutId);
      refreshTimeoutId = window.setTimeout(scheduleRefresh, 120);
    }

    function scheduleInitialRefreshes() {
      REFRESH_DELAYS.forEach((delay) => {
        const timeoutId = window.setTimeout(scheduleRefresh, delay);
        refreshTimeoutIds.push(timeoutId);
      });
    }

    function cleanupAnimation() {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(refreshFrameId);
      window.clearTimeout(refreshTimeoutId);
      refreshTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      refreshTimeoutIds.length = 0;
      resizeObserver?.disconnect();
      resizeObserver = null;
      split?.revert();
      split = null;
      context?.revert();
      context = null;
    }

    function handleLanguageChangeStart() {
      isDisposed = true;
      cleanupAnimation();
    }

    async function setupAnimation() {
      await Promise.all([
        waitForDocumentFonts(),
        waitForWindowLoad(),
        waitForLandingLoader(),
      ]);

      if (isDisposed) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        if (isDisposed) {
          return;
        }

        context?.revert();
        split?.revert();

        context = gsap.context(() => {
          split = new SplitText(quoteNode, {
            type: "words,chars",
            wordsClass: "horizontal-final-quote-word",
            charsClass: "horizontal-final-quote-char",
          });

          const metrics = getMetrics();

          gsap.set(track, {
            autoAlpha: 0,
            x: () => getMetrics().enterX,
          });
          gsap.set(orb, {
            autoAlpha: 1,
            scale: 1,
          });
          gsap.set(split.chars, {
            autoAlpha: 0,
            yPercent: () => gsap.utils.random(-180, 180),
            rotation: () => gsap.utils.random(-18, 18),
            transformOrigin: "50% 50%",
          });
          const scrollTween = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${getMetrics().scrollDistance}`,
              pin: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          scrollTween
            .to(orb, {
              autoAlpha: 0,
              scale: 0.92,
              duration: metrics.orbExitProgress,
            }, 0)
            .to(track, {
              autoAlpha: 1,
              duration: metrics.textFadeProgress,
            }, metrics.textStartProgress)
            .to(track, {
              x: () => getMetrics().settleX,
              duration: 1 - metrics.textStartProgress,
            }, metrics.textStartProgress)
            .to(track, {
              autoAlpha: 0,
              duration: metrics.orbReturnStartProgress - metrics.textExitStartProgress,
            }, metrics.textExitStartProgress)
            .to(orb, {
              autoAlpha: 1,
              scale: 1,
              duration: metrics.orbReturnFadeProgress,
            }, metrics.orbReturnStartProgress);

          split.chars.forEach((char) => {
            gsap.to(char, {
              autoAlpha: 1,
              yPercent: 0,
              rotation: 0,
              ease: "back.out(1.15)",
              scrollTrigger: {
                trigger: char,
                containerAnimation: scrollTween,
                start: "left 100%",
                end: "left 30%",
                scrub: 1,
              },
            });
          });

        }, section);

        scheduleInitialRefreshes();

        if ("ResizeObserver" in window) {
          resizeObserver = new ResizeObserver(scheduleDebouncedRefresh);
          resizeObserver.observe(section);
          resizeObserver.observe(track);
        }
      });
    }

    window.addEventListener(LANDING_LANGUAGE_CHANGE_START_EVENT, handleLanguageChangeStart);
    setupAnimation();

    return () => {
      isDisposed = true;
      window.removeEventListener(LANDING_LANGUAGE_CHANGE_START_EVENT, handleLanguageChangeStart);
      cleanupAnimation();
    };
  }, [authorText, quoteText]);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-label={`${quoteText} ${authorText}`}
    >
      <img
        ref={orbRef}
        className={styles.orb}
        src="/orb-ia.svg"
        alt=""
        aria-hidden="true"
        width="220"
        height="220"
      />
      <div ref={trackRef} className={styles.track} aria-hidden="true">
        <p ref={quoteRef} className={styles.quote}>
          {quote.before}
          <span className={styles.highlight}>{quote.highlight}</span>
          {quote.middle}
          <span className={styles.highlight}>{quote.secondHighlight}</span>
          {quote.after}
          <span className={styles.author}>{authorText}</span>
        </p>
      </div>
    </section>
  );
}
