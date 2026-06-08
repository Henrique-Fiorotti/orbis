"use client";

import * as React from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const splitTextConfig = {
  type: "chars,words",
  charsClass: "hero-dynamic-keyword-char",
  wordsClass: "hero-dynamic-keyword-word",
  smartWrap: true,
  autoSplit: true,
};

function getLongestWord(words) {
  return words
    .filter(Boolean)
    .reduce((longest, candidate) => (candidate.length > longest.length ? candidate : longest), "");
}

export default function AnimatedHeroKeyword({ word, className, reserveWords = [] }) {
  const currentRef = React.useRef(null);
  const nextRef = React.useRef(null);
  const timelineRef = React.useRef(null);
  const currentSplitRef = React.useRef(null);
  const nextSplitRef = React.useRef(null);
  const displayedWordRef = React.useRef(word);
  const [displayedWord, setDisplayedWord] = React.useState(word);
  const reservedWord = React.useMemo(
    () => getLongestWord([word, displayedWord, ...reserveWords]),
    [displayedWord, reserveWords, word],
  );

  useIsomorphicLayoutEffect(() => {
    const current = currentRef.current;
    const next = nextRef.current;

    if (!current || !next) {
      return undefined;
    }

    current.textContent = word;
    next.textContent = "";
    displayedWordRef.current = word;

    gsap.set(current, { autoAlpha: 1, yPercent: 0, rotationX: 0 });
    gsap.set(next, { autoAlpha: 0, yPercent: 0, rotationX: 0 });

    return () => {
      timelineRef.current?.kill();
      currentSplitRef.current?.revert();
      nextSplitRef.current?.revert();
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    const current = currentRef.current;
    const next = nextRef.current;

    if (!current || !next || !word || word === displayedWordRef.current) {
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    timelineRef.current?.kill();
    currentSplitRef.current?.revert();
    nextSplitRef.current?.revert();
    timelineRef.current = null;
    currentSplitRef.current = null;
    nextSplitRef.current = null;

    gsap.set([current, next], { clearProps: "all" });

    if (reducedMotion) {
      current.textContent = word;
      next.textContent = "";
      displayedWordRef.current = word;
      setDisplayedWord(word);
      return undefined;
    }

    next.textContent = word;

    const currentSplit = SplitText.create(current, splitTextConfig);
    const nextSplit = SplitText.create(next, splitTextConfig);
    currentSplitRef.current = currentSplit;
    nextSplitRef.current = nextSplit;

    const timeline = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        currentSplit.revert();
        nextSplit.revert();

        current.textContent = word;
        next.textContent = "";
        displayedWordRef.current = word;
        setDisplayedWord(word);

        gsap.set(current, { autoAlpha: 1, yPercent: 0, rotationX: 0, clearProps: "transform,visibility,opacity" });
        gsap.set(next, { autoAlpha: 0, yPercent: 0, rotationX: 0, clearProps: "transform" });

        if (currentSplitRef.current === currentSplit) {
          currentSplitRef.current = null;
        }

        if (nextSplitRef.current === nextSplit) {
          nextSplitRef.current = null;
        }

        if (timelineRef.current === timeline) {
          timelineRef.current = null;
        }
      },
    });
    timelineRef.current = timeline;

    gsap.set(current, { autoAlpha: 1 });
    gsap.set(next, { autoAlpha: 1 });
    gsap.set(nextSplit.chars, {
      autoAlpha: 0,
      yPercent: 78,
      rotationX: -18,
    });

    timeline
      .to(currentSplit.chars, {
        autoAlpha: 0,
        yPercent: -78,
        rotationX: 18,
        duration: 0.28,
        stagger: { each: 0.016, from: "start" },
      }, 0)
      .to(nextSplit.chars, {
        autoAlpha: 1,
        yPercent: 0,
        rotationX: 0,
        duration: 0.38,
        stagger: { each: 0.018, from: "start" },
      }, 0.08);

    return () => {
      timeline.kill();
      currentSplit.revert();
      nextSplit.revert();

      if (currentSplitRef.current === currentSplit) {
        currentSplitRef.current = null;
      }

      if (nextSplitRef.current === nextSplit) {
        nextSplitRef.current = null;
      }

      if (timelineRef.current === timeline) {
        timelineRef.current = null;
      }
    };
  }, [word]);

  return (
    <span className={className} aria-live="polite">
      <span ref={currentRef} className="hero-dynamic-keyword-layer">
        {displayedWord}
      </span>
      <span ref={nextRef} className="hero-dynamic-keyword-layer" aria-hidden="true" />
      <span className="hero-dynamic-keyword-sizer" aria-hidden="true">
        {reservedWord}
      </span>
    </span>
  );
}
