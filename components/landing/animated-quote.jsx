"use client";

import * as React from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

import { LANDING_LANGUAGE_CHANGE_START_EVENT } from "@/components/landing/language-provider";

gsap.registerPlugin(SplitText);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export default function AnimatedQuote({ quote, className = "" }) {
  const rootRef = React.useRef(null);
  const textRef = React.useRef(null);
  const metaRef = React.useRef(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const text = textRef.current;
    const meta = metaRef.current;

    if (!root || !text) {
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([text, meta].filter(Boolean), { autoAlpha: 1 });
      return undefined;
    }

    let split = null;
    let timeline = null;
    let didAnimate = false;
    let isDisposed = false;
    let observer = null;

    function cleanupAnimation() {
      timeline?.kill();
      timeline = null;
      split?.revert();
      split = null;
    }

    function playAnimation() {
      if (didAnimate || isDisposed) {
        return;
      }

      didAnimate = true;
      split = new SplitText(text, {
        type: "words",
        wordsClass: "quote-word",
      });

      gsap.set(text, { autoAlpha: 1 });
      gsap.set(split.words, {
        autoAlpha: 0,
        yPercent: 72,
        transformOrigin: "50% 100%",
      });

      if (meta) {
        gsap.set(meta, { autoAlpha: 0, y: 16 });
      }

      timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      timeline
        .to(split.words, {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.54,
          stagger: 0.035,
        })
        .to(meta, {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
        }, "-=0.26");
    }

    function handleLanguageChangeStart() {
      isDisposed = true;
      observer?.disconnect();
      cleanupAnimation();
    }

    window.addEventListener(LANDING_LANGUAGE_CHANGE_START_EVENT, handleLanguageChangeStart);

    if (typeof IntersectionObserver === "undefined") {
      playAnimation();
      return () => {
        isDisposed = true;
        window.removeEventListener(LANDING_LANGUAGE_CHANGE_START_EVENT, handleLanguageChangeStart);
        cleanupAnimation();
      };
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        playAnimation();
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.35 },
    );

    observer.observe(root);

    return () => {
      isDisposed = true;
      window.removeEventListener(LANDING_LANGUAGE_CHANGE_START_EVENT, handleLanguageChangeStart);
      observer.disconnect();
      cleanupAnimation();
    };
  }, [
    quote.after,
    quote.author,
    quote.before,
    quote.highlight,
    quote.joinText,
    quote.middle,
    quote.secondHighlight,
    quote.supportText,
  ]);

  return (
    <div ref={rootRef} className={className}>
      <p ref={textRef} className="quote-sentence" style={{ visibility: "hidden" }}>
        {quote.before}
        <span className="quote-highlight">{quote.highlight}</span>
        {quote.middle}
        <span className="quote-highlight">{quote.secondHighlight}</span>
        {quote.after}
      </p>
      <p ref={metaRef} className="quote-meta" style={{ visibility: "hidden" }}>
        {quote.supportText}
        <br />
        <span className="quote-author">{quote.author}</span>
        <br />
        <strong>{quote.joinText}</strong>
      </p>
    </div>
  );
}
