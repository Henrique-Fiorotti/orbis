"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import {
  getFinalQuoteAuthor,
  getFinalQuoteText,
} from "@/lib/landing-final-quote.mjs";
import { getHorizontalQuoteAnimationMetrics } from "@/lib/landing-horizontal-quote-animation.mjs";

import styles from "./horizontal-final-quote.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

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
    let isDisposed = false;

    function getMetrics() {
      return getHorizontalQuoteAnimationMetrics({
        sectionWidth: section.clientWidth,
        trackWidth: track.scrollWidth,
      });
    }

    async function setupAnimation() {
      try {
        await document.fonts?.ready;
      } catch {
        // Font readiness only improves SplitText measurements.
      }

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

        ScrollTrigger.refresh();
      });
    }

    setupAnimation();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameId);
      context?.revert();
      split?.revert();
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
