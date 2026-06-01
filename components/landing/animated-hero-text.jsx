"use client";

import * as React from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export default function AnimatedHeroText({
  titleLines,
  subtitle,
  titleClassName,
  subtitleClassName,
  titleStyle,
  subtitleStyle,
}) {
  const titleRef = React.useRef(null);
  const subtitleRef = React.useRef(null);
  const timelineRef = React.useRef(null);
  const titleSplitRef = React.useRef(null);
  const subtitleSplitRef = React.useRef(null);
  const titleKey = React.useMemo(
    () => titleLines.map((line) => `${line.before}${line.highlight}${line.after}`).join("|"),
    [titleLines],
  );

  useIsomorphicLayoutEffect(() => {
    const title = titleRef.current;
    const subtitleNode = subtitleRef.current;
    let isDisposed = false;
    let frameId = 0;
    let timeoutId = 0;
    let hasPlayed = false;

    if (!title || !subtitleNode) {
      return undefined;
    }

    function resetAnimation() {
      timelineRef.current?.kill();
      timelineRef.current = null;
      subtitleSplitRef.current?.revert();
      subtitleSplitRef.current = null;
      titleSplitRef.current?.revert();
      titleSplitRef.current = null;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([title, subtitleNode], { autoAlpha: 1 });
      return undefined;
    }

    async function playHeroIntro() {
      if (hasPlayed) {
        return;
      }

      hasPlayed = true;
      resetAnimation();
      gsap.set([title, subtitleNode], { autoAlpha: 0, visibility: "hidden" });

      try {
        await document.fonts?.ready;
      } catch {
        // Font readiness is a progressive enhancement here.
      }

      if (isDisposed) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        if (isDisposed) {
          return;
        }

        titleSplitRef.current = new SplitText(title, {
          type: "words,chars",
          wordsClass: "hero-title-word",
          charsClass: "hero-title-char",
        });

        subtitleSplitRef.current = new SplitText(subtitleNode, {
          type: "words",
          wordsClass: "hero-subtitle-word",
        });

        gsap.set([title, subtitleNode], { autoAlpha: 1 });
        gsap.set(titleSplitRef.current.chars, {
          autoAlpha: 0,
          yPercent: 96,
          rotateX: -36,
          transformOrigin: "50% 100%",
        });

        gsap.set(subtitleSplitRef.current.words, {
          autoAlpha: 0,
          y: 14,
        });

        timelineRef.current = gsap.timeline({
          delay: 0.18,
          defaults: { ease: "power3.out" },
        });

        timelineRef.current
          .to(titleSplitRef.current.chars, {
            autoAlpha: 1,
            yPercent: 0,
            rotateX: 0,
            duration: 0.62,
            stagger: 0.01,
          })
          .to(
            subtitleSplitRef.current.words,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.38,
              stagger: 0.025,
            },
            "-=0.12",
          );
      });
    }

    function handlePageShow(event) {
      if (event.persisted) {
        hasPlayed = false;
        scheduleHeroIntro();
      }
    }

    function scheduleHeroIntro() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(playHeroIntro, 180);
    }

    function handleLandingLoaderComplete() {
      scheduleHeroIntro();
    }

    if (window.__orbisLandingLoaderComplete) {
      scheduleHeroIntro();
    } else {
      window.addEventListener("orbis:landing-loader-complete", handleLandingLoaderComplete, { once: true });
      timeoutId = window.setTimeout(playHeroIntro, 3200);
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("orbis:landing-loader-complete", handleLandingLoaderComplete);
      window.removeEventListener("pageshow", handlePageShow);
      resetAnimation();
    };
  }, [subtitle, titleKey]);

  return (
    <>
      <h1
        ref={titleRef}
        className={titleClassName}
        style={titleStyle}
      >
        {titleLines.map((line, index) => (
          <span key={`${line.highlight}-${index}`}>
            {line.before}
            <span style={{ color: "#7c3aed" }}>{line.highlight}</span>
            {line.after}
            {index < titleLines.length - 1 ? <br /> : null}
          </span>
        ))}
      </h1>

      <p
        ref={subtitleRef}
        className={subtitleClassName}
        style={subtitleStyle}
      >
        {subtitle}
      </p>
    </>
  );
}
